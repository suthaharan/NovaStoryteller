# Generated migration to add Plan, Invoice models and update Subscription with UUIDs
# This migration handles cases where tables may already exist

from django.db import migrations, models
from django.db.migrations.operations import SeparateDatabaseAndState
import django.db.models.deletion
import uuid
from django.conf import settings


def check_table_exists(cursor, table_name):
    """Check if a table exists in the database."""
    cursor.execute("""
        SELECT COUNT(*) FROM information_schema.tables 
        WHERE table_schema = DATABASE() 
        AND table_name = %s
    """, [table_name])
    return cursor.fetchone()[0] > 0


def check_column_exists(cursor, table_name, column_name):
    """Check if a column exists in a table."""
    cursor.execute("""
        SELECT COUNT(*) FROM information_schema.columns 
        WHERE table_schema = DATABASE() 
        AND table_name = %s 
        AND column_name = %s
    """, [table_name, column_name])
    return cursor.fetchone()[0] > 0


def create_default_plans(apps, schema_editor):
    """Create default plans from existing subscription plan choices."""
    from django.db import connection
    
    # Check if Plan table exists
    with connection.cursor() as cursor:
        if not check_table_exists(cursor, 'api_plan'):
            return  # Table doesn't exist, migration will create it
    
    try:
        Plan = apps.get_model('api', 'Plan')
    except LookupError:
        # Model not in migration state, use raw SQL
        with connection.cursor() as cursor:
            default_plans = [
                ('Basic', 0.00, 1, False),
                ('Premium', 19.00, 1, True),
                ('Enterprise', 29.00, 1, False),
            ]
            for name, price, duration, popular in default_plans:
                uuid_str = str(uuid.uuid4()).strip()
                cursor.execute("""
                    INSERT IGNORE INTO api_plan (name, price, duration_months, is_popular, is_active, uuid, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, TRUE, %s, NOW(), NOW())
                """, [name, price, duration, popular, uuid_str])
        return
    
    # Create default plans if they don't exist
    default_plans = [
        {'name': 'Basic', 'price': 0.00, 'duration_months': 1, 'is_popular': False},
        {'name': 'Premium', 'price': 19.00, 'duration_months': 1, 'is_popular': True},
        {'name': 'Enterprise', 'price': 29.00, 'duration_months': 1, 'is_popular': False},
    ]
    
    for plan_data in default_plans:
        Plan.objects.get_or_create(
            name=plan_data['name'],
            defaults={
                'uuid': uuid.uuid4(),
                'price': plan_data['price'],
                'duration_months': plan_data['duration_months'],
                'is_popular': plan_data['is_popular'],
                'is_active': True,
            }
        )


def migrate_subscription_plans(apps, schema_editor):
    """Convert existing subscription plan strings to Plan ForeignKey references."""
    from django.db import connection
    
    # Map old plan strings to Plan names
    plan_mapping = {
        'basic': 'Basic',
        'premium': 'Premium',
        'enterprise': 'Enterprise',
    }
    
    with connection.cursor() as cursor:
        # Check if Plan table exists
        if not check_table_exists(cursor, 'api_plan'):
            return  # Plan table doesn't exist yet
        
        # Check if old plan column exists (CharField)
        if not check_column_exists(cursor, 'api_subscription', 'plan'):
            return  # Old plan field doesn't exist, already migrated
        
        # Check if plan_fk_id column exists
        if not check_column_exists(cursor, 'api_subscription', 'plan_fk_id'):
            return  # New field doesn't exist yet
        
        # Check if old plan is CharField (not ForeignKey)
        cursor.execute("""
            SELECT data_type FROM information_schema.columns 
            WHERE table_schema = DATABASE() 
            AND table_name = 'api_subscription' 
            AND column_name = 'plan'
        """)
        col_type = cursor.fetchone()
        if not col_type or col_type[0] not in ['varchar', 'char']:
            return  # Already a ForeignKey
        
        # Read old plan values and migrate
        cursor.execute("SELECT id, plan FROM api_subscription WHERE plan IS NOT NULL AND plan != ''")
        rows = cursor.fetchall()
        
        for sub_id, old_plan_value in rows:
            if old_plan_value and old_plan_value.lower() in plan_mapping:
                plan_name = plan_mapping[old_plan_value.lower()]
                # Get plan ID directly from database
                cursor.execute("SELECT id FROM api_plan WHERE name = %s", [plan_name])
                plan_row = cursor.fetchone()
                if plan_row:
                    plan_id = plan_row[0]
                    # Update the new plan_fk field
                    cursor.execute(
                        "UPDATE api_subscription SET plan_fk_id = %s WHERE id = %s",
                        [plan_id, sub_id]
                    )


def generate_uuids_for_plans(apps, schema_editor):
    """Generate UUIDs for existing Plan records."""
    from django.db import connection
    
    with connection.cursor() as cursor:
        if not check_table_exists(cursor, 'api_plan'):
            return
        if not check_column_exists(cursor, 'api_plan', 'uuid'):
            return
        
        # Ensure column is VARCHAR(36) before inserting
        cursor.execute("""
            SELECT data_type, character_maximum_length 
            FROM information_schema.columns 
            WHERE table_schema = DATABASE() 
            AND table_name = 'api_plan' 
            AND column_name = 'uuid'
        """)
        col_info = cursor.fetchone()
        if col_info:
            data_type, max_length = col_info
            if data_type == 'char' or (data_type == 'varchar' and max_length != 36):
                cursor.execute("ALTER TABLE api_plan MODIFY COLUMN uuid VARCHAR(36) NULL")
        
        # Use raw SQL to update UUIDs
        cursor.execute("SELECT id FROM api_plan WHERE uuid IS NULL OR uuid = ''")
        rows = cursor.fetchall()
        for plan_id, in rows:
            uuid_obj = uuid.uuid4()
            uuid_str = str(uuid_obj).strip()[:36]  # Ensure exactly 36 characters
            cursor.execute(
                "UPDATE api_plan SET uuid = %s WHERE id = %s",
                [uuid_str, plan_id]
            )
        return
    
    # Try using ORM if model is available
    try:
        Plan = apps.get_model('api', 'Plan')
        for plan in Plan.objects.all():
            if not plan.uuid:
                plan.uuid = uuid.uuid4()
                plan.save(update_fields=['uuid'])
    except LookupError:
        pass  # Model not in state, already handled with raw SQL


def generate_uuids_for_subscriptions(apps, schema_editor):
    """Generate UUIDs for existing Subscription records."""
    from django.db import connection
    
    with connection.cursor() as cursor:
        if not check_table_exists(cursor, 'api_subscription'):
            return
        if not check_column_exists(cursor, 'api_subscription', 'uuid'):
            return
        
        # Ensure column is VARCHAR(36) before inserting
        cursor.execute("""
            SELECT data_type, character_maximum_length 
            FROM information_schema.columns 
            WHERE table_schema = DATABASE() 
            AND table_name = 'api_subscription' 
            AND column_name = 'uuid'
        """)
        col_info = cursor.fetchone()
        if col_info:
            data_type, max_length = col_info
            if data_type == 'char' or (data_type == 'varchar' and max_length != 36):
                cursor.execute("ALTER TABLE api_subscription MODIFY COLUMN uuid VARCHAR(36) NULL")
        
        # Use raw SQL to update UUIDs
        cursor.execute("SELECT id FROM api_subscription WHERE uuid IS NULL OR uuid = ''")
        rows = cursor.fetchall()
        for sub_id, in rows:
            uuid_obj = uuid.uuid4()
            uuid_str = str(uuid_obj).strip()[:36]  # Ensure exactly 36 characters
            cursor.execute(
                "UPDATE api_subscription SET uuid = %s WHERE id = %s",
                [uuid_str, sub_id]
            )
        return
    
    # Try using ORM if model is available
    try:
        Subscription = apps.get_model('api', 'Subscription')
        for subscription in Subscription.objects.all():
            if not subscription.uuid:
                subscription.uuid = uuid.uuid4()
                subscription.save(update_fields=['uuid'])
    except LookupError:
        pass  # Model not in state, already handled with raw SQL


def generate_uuids_for_invoices(apps, schema_editor):
    """Generate UUIDs for existing Invoice records."""
    from django.db import connection
    
    with connection.cursor() as cursor:
        if not check_table_exists(cursor, 'api_invoice'):
            return
        if not check_column_exists(cursor, 'api_invoice', 'uuid'):
            return
        
        # Ensure column is VARCHAR(36) before inserting
        cursor.execute("""
            SELECT data_type, character_maximum_length 
            FROM information_schema.columns 
            WHERE table_schema = DATABASE() 
            AND table_name = 'api_invoice' 
            AND column_name = 'uuid'
        """)
        col_info = cursor.fetchone()
        if col_info:
            data_type, max_length = col_info
            if data_type == 'char' or (data_type == 'varchar' and max_length != 36):
                cursor.execute("ALTER TABLE api_invoice MODIFY COLUMN uuid VARCHAR(36) NULL")
        
        # Use raw SQL to update UUIDs
        cursor.execute("SELECT id FROM api_invoice WHERE uuid IS NULL OR uuid = ''")
        rows = cursor.fetchall()
        for invoice_id, in rows:
            uuid_obj = uuid.uuid4()
            uuid_str = str(uuid_obj).strip()[:36]  # Ensure exactly 36 characters
            cursor.execute(
                "UPDATE api_invoice SET uuid = %s WHERE id = %s",
                [uuid_str, invoice_id]
            )
        return
    
    # Try using ORM if model is available
    try:
        Invoice = apps.get_model('api', 'Invoice')
        for invoice in Invoice.objects.all():
            if not invoice.uuid:
                invoice.uuid = uuid.uuid4()
                invoice.save(update_fields=['uuid'])
    except LookupError:
        pass  # Model not in state, already handled with raw SQL


def add_plan_fk_if_not_exists(apps, schema_editor):
    """Add plan_fk_id column to Subscription if it doesn't exist."""
    from django.db import connection
    with connection.cursor() as cursor:
        if not check_column_exists(cursor, 'api_subscription', 'plan_fk_id'):
            cursor.execute("ALTER TABLE api_subscription ADD COLUMN plan_fk_id BIGINT NULL")
            
            # Check if FK constraint exists
            cursor.execute("""
                SELECT COUNT(*) FROM information_schema.table_constraints 
                WHERE table_schema = DATABASE() 
                AND table_name = 'api_subscription' 
                AND constraint_name LIKE '%plan_fk%'
            """)
            fk_exists = cursor.fetchone()[0]
            
            if fk_exists == 0:
                cursor.execute("""
                    ALTER TABLE api_subscription 
                    ADD CONSTRAINT api_subscription_plan_fk_id_fk 
                    FOREIGN KEY (plan_fk_id) REFERENCES api_plan(id) ON DELETE SET NULL
                """)


def rename_plan_fk_to_plan_if_needed(apps, schema_editor):
    """Rename plan_fk_id to plan_id if plan_fk_id exists and plan_id doesn't."""
    from django.db import connection
    with connection.cursor() as cursor:
        plan_fk_exists = check_column_exists(cursor, 'api_subscription', 'plan_fk_id')
        plan_id_exists = check_column_exists(cursor, 'api_subscription', 'plan_id')
        
        if plan_fk_exists and not plan_id_exists:
            # Rename the column
            cursor.execute("ALTER TABLE api_subscription CHANGE COLUMN plan_fk_id plan_id BIGINT NULL")
            
            # Check if we need to rename the FK constraint
            cursor.execute("""
                SELECT constraint_name FROM information_schema.table_constraints 
                WHERE table_schema = DATABASE() 
                AND table_name = 'api_subscription' 
                AND constraint_name LIKE '%plan_fk%'
                LIMIT 1
            """)
            constraint_row = cursor.fetchone()
            if constraint_row:
                old_constraint = constraint_row[0]
                new_constraint = 'api_subscription_plan_id_fk'
                # Drop old constraint and add new one
                cursor.execute(f"ALTER TABLE api_subscription DROP FOREIGN KEY {old_constraint}")
                cursor.execute("""
                    ALTER TABLE api_subscription 
                    ADD CONSTRAINT api_subscription_plan_id_fk 
                    FOREIGN KEY (plan_id) REFERENCES api_plan(id) ON DELETE SET NULL
                """)


def add_uuid_to_subscription_if_not_exists(apps, schema_editor):
    """Add UUID column to Subscription if it doesn't exist, or alter it to VARCHAR(36) if it exists as CHAR."""
    from django.db import connection
    with connection.cursor() as cursor:
        if not check_column_exists(cursor, 'api_subscription', 'uuid'):
            cursor.execute("ALTER TABLE api_subscription ADD COLUMN uuid VARCHAR(36) NULL")
            # Add index if it doesn't exist
            cursor.execute("""
                SELECT COUNT(*) FROM information_schema.statistics 
                WHERE table_schema = DATABASE() 
                AND table_name = 'api_subscription' 
                AND index_name = 'api_subscription_uuid_idx'
            """)
            index_exists = cursor.fetchone()[0]
            if index_exists == 0:
                cursor.execute("CREATE INDEX api_subscription_uuid_idx ON api_subscription(uuid)")
        else:
            # Column exists, check if it's CHAR and alter to VARCHAR(36)
            cursor.execute("""
                SELECT data_type, character_maximum_length 
                FROM information_schema.columns 
                WHERE table_schema = DATABASE() 
                AND table_name = 'api_subscription' 
                AND column_name = 'uuid'
            """)
            col_info = cursor.fetchone()
            if col_info:
                data_type, max_length = col_info
                if data_type == 'char' or (data_type == 'varchar' and max_length != 36):
                    cursor.execute("ALTER TABLE api_subscription MODIFY COLUMN uuid VARCHAR(36) NULL")


def add_uuid_to_invoice_if_not_exists(apps, schema_editor):
    """Add UUID column to Invoice if it doesn't exist, or alter it to VARCHAR(36) if it exists as CHAR."""
    from django.db import connection
    with connection.cursor() as cursor:
        if not check_column_exists(cursor, 'api_invoice', 'uuid'):
            cursor.execute("ALTER TABLE api_invoice ADD COLUMN uuid VARCHAR(36) NULL")
            # Add index if it doesn't exist
            cursor.execute("""
                SELECT COUNT(*) FROM information_schema.statistics 
                WHERE table_schema = DATABASE() 
                AND table_name = 'api_invoice' 
                AND index_name = 'api_invoice_uuid_idx'
            """)
            index_exists = cursor.fetchone()[0]
            if index_exists == 0:
                cursor.execute("CREATE INDEX api_invoice_uuid_idx ON api_invoice(uuid)")
        else:
            # Column exists, check if it's CHAR and alter to VARCHAR(36)
            cursor.execute("""
                SELECT data_type, character_maximum_length 
                FROM information_schema.columns 
                WHERE table_schema = DATABASE() 
                AND table_name = 'api_invoice' 
                AND column_name = 'uuid'
            """)
            col_info = cursor.fetchone()
            if col_info:
                data_type, max_length = col_info
                if data_type == 'char' or (data_type == 'varchar' and max_length != 36):
                    cursor.execute("ALTER TABLE api_invoice MODIFY COLUMN uuid VARCHAR(36) NULL")


def ensure_uuid_column_format(table_name, column_name='uuid'):
    """Ensure UUID column is VARCHAR(36) and clean any invalid data."""
    from django.db import connection
    with connection.cursor() as cursor:
        if not check_column_exists(cursor, table_name, column_name):
            return
        
        # Check column type first
        cursor.execute("""
            SELECT data_type, character_maximum_length 
            FROM information_schema.columns 
            WHERE table_schema = DATABASE() 
            AND table_name = %s 
            AND column_name = %s
        """, [table_name, column_name])
        col_info = cursor.fetchone()
        if not col_info:
            return
        
        data_type, max_length = col_info
        
        # First, always clean any invalid UUID data (truncate to 36 chars)
        # Use backticks for table/column names to handle special characters
        try:
            cursor.execute("""
                UPDATE `{}` 
                SET `{}` = SUBSTRING(`{}`, 1, 36)
                WHERE `{}` IS NOT NULL AND `{}` != '' AND LENGTH(`{}`) > 36
            """.format(table_name, column_name, column_name, column_name, column_name, column_name))
        except Exception:
            pass  # Ignore errors if no rows to update
        
        # Also set empty strings to NULL
        try:
            cursor.execute("""
                UPDATE `{}` 
                SET `{}` = NULL
                WHERE `{}` = '' OR `{}` = 'None'
            """.format(table_name, column_name, column_name, column_name))
        except Exception:
            pass  # Ignore errors if no rows to update
        
        # Always ensure it's VARCHAR(36), even if it's already VARCHAR with different length
        if data_type == 'char' or data_type != 'varchar' or (max_length is not None and max_length != 36):
            try:
                cursor.execute("ALTER TABLE `{}` MODIFY COLUMN `{}` VARCHAR(36) NULL".format(table_name, column_name))
            except Exception as e:
                # If alter fails, try to see what the actual issue is
                # But continue anyway - the column might already be correct
                pass


def prepare_plan_uuid_for_alter(apps, schema_editor):
    """Prepare Plan UUID column before AlterField."""
    ensure_uuid_column_format('api_plan', 'uuid')


def prepare_subscription_uuid_for_alter(apps, schema_editor):
    """Prepare Subscription UUID column before AlterField."""
    ensure_uuid_column_format('api_subscription', 'uuid')


def prepare_invoice_uuid_for_alter(apps, schema_editor):
    """Prepare Invoice UUID column before AlterField."""
    ensure_uuid_column_format('api_invoice', 'uuid')


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0010_add_uuid_to_page_category'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # Step 0: Ensure UUID columns are VARCHAR(36) if they exist (fix for existing tables)
        migrations.RunSQL(
            sql="""
                -- Alter api_plan.uuid if it exists and is CHAR
                SET @col_exists = 0;
                SELECT COUNT(*) INTO @col_exists FROM information_schema.columns 
                WHERE table_schema = DATABASE() 
                AND table_name = 'api_plan' 
                AND column_name = 'uuid'
                AND data_type = 'char';
                SET @sql = IF(@col_exists > 0, 
                    'ALTER TABLE api_plan MODIFY COLUMN uuid VARCHAR(36) NULL',
                    'SELECT 1 AS skip');
                PREPARE stmt FROM @sql;
                EXECUTE stmt;
                DEALLOCATE PREPARE stmt;
                
                -- Alter api_invoice.uuid if it exists and is CHAR
                SET @col_exists2 = 0;
                SELECT COUNT(*) INTO @col_exists2 FROM information_schema.columns 
                WHERE table_schema = DATABASE() 
                AND table_name = 'api_invoice' 
                AND column_name = 'uuid'
                AND data_type = 'char';
                SET @sql2 = IF(@col_exists2 > 0, 
                    'ALTER TABLE api_invoice MODIFY COLUMN uuid VARCHAR(36) NULL',
                    'SELECT 1 AS skip');
                PREPARE stmt2 FROM @sql2;
                EXECUTE stmt2;
                DEALLOCATE PREPARE stmt2;
            """,
            reverse_sql=migrations.RunSQL.noop,
        ),
        # Step 1: Create Plan model (handle case where table might already exist)
        SeparateDatabaseAndState(
            database_operations=[
                migrations.RunSQL(
                    sql="""
                        CREATE TABLE IF NOT EXISTS api_plan (
                            id BIGINT AUTO_INCREMENT PRIMARY KEY,
                            uuid VARCHAR(36) NULL,
                            name VARCHAR(100) NOT NULL UNIQUE,
                            description LONGTEXT NOT NULL,
                            price DECIMAL(10, 2) NOT NULL DEFAULT 0.0,
                            duration_months INT NOT NULL DEFAULT 1,
                            features JSON NOT NULL,
                            is_popular BOOLEAN NOT NULL DEFAULT FALSE,
                            is_active BOOLEAN NOT NULL DEFAULT TRUE,
                            display_order INT NOT NULL DEFAULT 0,
                            created_at DATETIME(6) NOT NULL,
                            updated_at DATETIME(6) NOT NULL,
                            INDEX api_plan_uuid_idx (uuid)
                        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
                    """,
                    reverse_sql="DROP TABLE IF EXISTS api_plan;",
                ),
            ],
            state_operations=[
                migrations.CreateModel(
                    name='Plan',
                    fields=[
                        ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                        ('uuid', models.UUIDField(null=True, blank=True, db_index=True)),
                        ('name', models.CharField(max_length=100, unique=True)),
                        ('description', models.TextField(blank=True)),
                        ('price', models.DecimalField(decimal_places=2, default=0.0, max_digits=10)),
                        ('duration_months', models.IntegerField(default=1, help_text='Duration in months (1 for monthly, 12 for yearly)')),
                        ('features', models.JSONField(blank=True, default=list, help_text='List of features included in this plan')),
                        ('is_popular', models.BooleanField(default=False, help_text='Mark as popular plan')),
                        ('is_active', models.BooleanField(default=True)),
                        ('display_order', models.IntegerField(default=0, help_text='Order for display (lower numbers appear first)')),
                        ('created_at', models.DateTimeField(auto_now_add=True)),
                        ('updated_at', models.DateTimeField(auto_now=True)),
                    ],
                    options={
                        'verbose_name': 'Plan',
                        'verbose_name_plural': 'Plans',
                        'ordering': ['display_order', 'name'],
                    },
                ),
            ],
        ),
        migrations.RunPython(create_default_plans, migrations.RunPython.noop),
        migrations.RunPython(generate_uuids_for_plans, migrations.RunPython.noop),
        migrations.RunPython(prepare_plan_uuid_for_alter, migrations.RunPython.noop),
        # Use SeparateDatabaseAndState to handle database changes manually
        SeparateDatabaseAndState(
            database_operations=[
                migrations.RunSQL(
                    sql="""
                        -- Ensure column is VARCHAR(36) and has unique constraint
                        ALTER TABLE api_plan MODIFY COLUMN uuid VARCHAR(36) NOT NULL;
                        -- Add unique constraint if it doesn't exist
                        SET @constraint_exists = (SELECT COUNT(*) FROM information_schema.table_constraints 
                            WHERE table_schema = DATABASE() 
                            AND table_name = 'api_plan' 
                            AND constraint_name = 'api_plan_uuid_key');
                        SET @sql = IF(@constraint_exists = 0, 
                            'ALTER TABLE api_plan ADD CONSTRAINT api_plan_uuid_key UNIQUE (uuid)',
                            'SELECT 1 AS skip');
                        PREPARE stmt FROM @sql;
                        EXECUTE stmt;
                        DEALLOCATE PREPARE stmt;
                    """,
                    reverse_sql=migrations.RunSQL.noop,
                ),
            ],
            state_operations=[
                migrations.AlterField(
                    model_name='plan',
                    name='uuid',
                    field=models.UUIDField(default=uuid.uuid4, unique=True, editable=False, db_index=True),
                ),
            ],
        ),
        
        # Step 2: Remove features field from Subscription (if it exists)
        migrations.RunSQL(
            sql="""
                SELECT COUNT(*) INTO @exists FROM information_schema.columns 
                WHERE table_schema = DATABASE() 
                AND table_name = 'api_subscription' 
                AND column_name = 'features';
                SET @sql = IF(@exists > 0, 
                    'ALTER TABLE api_subscription DROP COLUMN features',
                    'SELECT 1');
                PREPARE stmt FROM @sql;
                EXECUTE stmt;
                DEALLOCATE PREPARE stmt;
            """,
            reverse_sql=migrations.RunSQL.noop,
        ),
        
        # Step 3: Add new plan_fk ForeignKey field (nullable) - conditional
        migrations.RunPython(add_plan_fk_if_not_exists, migrations.RunPython.noop),
        # Add to state for Django's migration tracking (only updates state, not database)
        SeparateDatabaseAndState(
            database_operations=[],
            state_operations=[
                migrations.AddField(
                    model_name='subscription',
                    name='plan_fk',
                    field=models.ForeignKey(null=True, blank=True, on_delete=django.db.models.deletion.SET_NULL, related_name='temp_subscriptions', to='api.plan'),
                ),
            ],
        ),
        
        # Step 4: Migrate data from old plan CharField to new plan_fk ForeignKey
        migrations.RunPython(migrate_subscription_plans, migrations.RunPython.noop),
        
        # Step 5: Remove old plan CharField (if it exists and is CharField, not ForeignKey)
        migrations.RunSQL(
            sql="""
                SELECT COUNT(*) INTO @exists FROM information_schema.columns 
                WHERE table_schema = DATABASE() 
                AND table_name = 'api_subscription' 
                AND column_name = 'plan'
                AND data_type IN ('varchar', 'char');
                SET @sql = IF(@exists > 0, 
                    'ALTER TABLE api_subscription DROP COLUMN plan',
                    'SELECT 1');
                PREPARE stmt FROM @sql;
                EXECUTE stmt;
                DEALLOCATE PREPARE stmt;
            """,
            reverse_sql=migrations.RunSQL.noop,
        ),
        
        # Step 6: Rename plan_fk to plan (conditional - only if plan_fk_id exists and plan_id doesn't)
        migrations.RunPython(rename_plan_fk_to_plan_if_needed, migrations.RunPython.noop),
        # Update state for Django's migration tracking (only updates state, not database)
        SeparateDatabaseAndState(
            database_operations=[],
            state_operations=[
                migrations.RenameField(
                    model_name='subscription',
                    old_name='plan_fk',
                    new_name='plan',
                ),
            ],
        ),
        
        # Step 7: Add UUID to Subscription (nullable first) - conditional
        migrations.RunPython(add_uuid_to_subscription_if_not_exists, migrations.RunPython.noop),
        # Update state for Django's migration tracking
        # Database column is handled by Python function above, this only updates Django's state
        SeparateDatabaseAndState(
            database_operations=[],  # Don't touch database, column already handled by Python function
            state_operations=[
                migrations.AddField(
                    model_name='subscription',
                    name='uuid',
                    field=models.UUIDField(null=True, blank=True, db_index=True),
                ),
            ],
        ),
        migrations.RunPython(generate_uuids_for_subscriptions, migrations.RunPython.noop),
        migrations.RunPython(prepare_subscription_uuid_for_alter, migrations.RunPython.noop),
        # Use SeparateDatabaseAndState to handle database changes manually
        SeparateDatabaseAndState(
            database_operations=[
                migrations.RunSQL(
                    sql="""
                        -- Ensure column is VARCHAR(36) and has unique constraint
                        ALTER TABLE api_subscription MODIFY COLUMN uuid VARCHAR(36) NOT NULL;
                        -- Add unique constraint if it doesn't exist
                        SET @constraint_exists = (SELECT COUNT(*) FROM information_schema.table_constraints 
                            WHERE table_schema = DATABASE() 
                            AND table_name = 'api_subscription' 
                            AND constraint_name = 'api_subscription_uuid_key');
                        SET @sql = IF(@constraint_exists = 0, 
                            'ALTER TABLE api_subscription ADD CONSTRAINT api_subscription_uuid_key UNIQUE (uuid)',
                            'SELECT 1 AS skip');
                        PREPARE stmt FROM @sql;
                        EXECUTE stmt;
                        DEALLOCATE PREPARE stmt;
                    """,
                    reverse_sql=migrations.RunSQL.noop,
                ),
            ],
            state_operations=[
                migrations.AlterField(
                    model_name='subscription',
                    name='uuid',
                    field=models.UUIDField(default=uuid.uuid4, unique=True, editable=False, db_index=True),
                ),
            ],
        ),
        
        # Step 8: Create Invoice model (handle case where table might already exist)
        SeparateDatabaseAndState(
            database_operations=[
                migrations.RunSQL(
                    sql="""
                        CREATE TABLE IF NOT EXISTS api_invoice (
                            id BIGINT AUTO_INCREMENT PRIMARY KEY,
                            uuid VARCHAR(36) NULL,
                            invoice_number VARCHAR(50) NOT NULL UNIQUE,
                            subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0.0,
                            discount DECIMAL(10, 2) NOT NULL DEFAULT 0.0,
                            total DECIMAL(10, 2) NOT NULL DEFAULT 0.0,
                            status VARCHAR(20) NOT NULL DEFAULT 'pending',
                            payment_method VARCHAR(20) NULL,
                            due_date DATETIME(6) NULL,
                            paid_date DATETIME(6) NULL,
                            notes LONGTEXT NOT NULL,
                            created_at DATETIME(6) NOT NULL,
                            updated_at DATETIME(6) NOT NULL,
                            subscription_id BIGINT NULL,
                            user_id INT NOT NULL,
                            plan_id BIGINT NULL,
                            INDEX api_invoice_invoice_59a3b3_idx (invoice_number),
                            INDEX api_invoice_user_id_8dad79_idx (user_id, created_at),
                            INDEX api_invoice_status_0748d6_idx (status, created_at),
                            INDEX api_invoice_uuid_idx (uuid),
                            FOREIGN KEY (subscription_id) REFERENCES api_subscription(id) ON DELETE SET NULL,
                            FOREIGN KEY (user_id) REFERENCES auth_user(id) ON DELETE CASCADE,
                            FOREIGN KEY (plan_id) REFERENCES api_plan(id) ON DELETE SET NULL
                        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
                    """,
                    reverse_sql="DROP TABLE IF EXISTS api_invoice;",
                ),
            ],
            state_operations=[
                migrations.CreateModel(
                    name='Invoice',
                    fields=[
                        ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                        ('uuid', models.UUIDField(null=True, blank=True, db_index=True)),
                        ('invoice_number', models.CharField(db_index=True, max_length=50, unique=True)),
                        ('subtotal', models.DecimalField(decimal_places=2, default=0.0, max_digits=10)),
                        ('discount', models.DecimalField(decimal_places=2, default=0.0, max_digits=10)),
                        ('total', models.DecimalField(decimal_places=2, default=0.0, max_digits=10)),
                        ('status', models.CharField(choices=[('pending', 'Pending'), ('paid', 'Paid'), ('overdue', 'Overdue'), ('cancelled', 'Cancelled')], default='pending', max_length=20)),
                        ('payment_method', models.CharField(blank=True, choices=[('credit_card', 'Credit Card'), ('debit_card', 'Debit Card'), ('bank_transfer', 'Bank Transfer'), ('paypal', 'PayPal'), ('stripe', 'Stripe'), ('other', 'Other')], max_length=20, null=True)),
                        ('due_date', models.DateTimeField(blank=True, null=True)),
                        ('paid_date', models.DateTimeField(blank=True, null=True)),
                        ('notes', models.TextField(blank=True, help_text='Invoice notes or terms')),
                        ('created_at', models.DateTimeField(auto_now_add=True)),
                        ('updated_at', models.DateTimeField(auto_now=True)),
                        ('subscription', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='invoices', to='api.subscription')),
                        ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='invoices', to=settings.AUTH_USER_MODEL)),
                        ('plan', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='invoices', to='api.plan')),
                    ],
                    options={
                        'verbose_name': 'Invoice',
                        'verbose_name_plural': 'Invoices',
                        'ordering': ['-created_at'],
                        'indexes': [
                            models.Index(fields=['invoice_number'], name='api_invoice_invoice_59a3b3_idx'),
                            models.Index(fields=['user', '-created_at'], name='api_invoice_user_id_8dad79_idx'),
                            models.Index(fields=['status', '-created_at'], name='api_invoice_status_0748d6_idx'),
                        ],
                    },
                ),
            ],
        ),
        # Add UUID to Invoice if table exists but column doesn't
        migrations.RunPython(add_uuid_to_invoice_if_not_exists, migrations.RunPython.noop),
        # Update state for Django's migration tracking
        # Database column is handled by Python function above (or created with table), this only updates Django's state
        SeparateDatabaseAndState(
            database_operations=[],  # Don't touch database, column already handled by Python function or CREATE TABLE
            state_operations=[
                migrations.AddField(
                    model_name='invoice',
                    name='uuid',
                    field=models.UUIDField(null=True, blank=True, db_index=True),
                ),
            ],
        ),
        migrations.RunPython(generate_uuids_for_invoices, migrations.RunPython.noop),
        migrations.RunPython(prepare_invoice_uuid_for_alter, migrations.RunPython.noop),
        # Use SeparateDatabaseAndState to handle database changes manually
        SeparateDatabaseAndState(
            database_operations=[
                migrations.RunSQL(
                    sql="""
                        -- Ensure column is VARCHAR(36) and has unique constraint
                        ALTER TABLE api_invoice MODIFY COLUMN uuid VARCHAR(36) NOT NULL;
                        -- Add unique constraint if it doesn't exist
                        SET @constraint_exists = (SELECT COUNT(*) FROM information_schema.table_constraints 
                            WHERE table_schema = DATABASE() 
                            AND table_name = 'api_invoice' 
                            AND constraint_name = 'api_invoice_uuid_key');
                        SET @sql = IF(@constraint_exists = 0, 
                            'ALTER TABLE api_invoice ADD CONSTRAINT api_invoice_uuid_key UNIQUE (uuid)',
                            'SELECT 1 AS skip');
                        PREPARE stmt FROM @sql;
                        EXECUTE stmt;
                        DEALLOCATE PREPARE stmt;
                    """,
                    reverse_sql=migrations.RunSQL.noop,
                ),
            ],
            state_operations=[
                migrations.AlterField(
                    model_name='invoice',
                    name='uuid',
                    field=models.UUIDField(default=uuid.uuid4, unique=True, editable=False, db_index=True),
                ),
            ],
        ),
    ]
