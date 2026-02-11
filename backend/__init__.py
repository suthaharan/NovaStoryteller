# PyMySQL configuration (must be before Django imports MySQL backend)
# This allows PyMySQL to work as a drop-in replacement for mysqlclient
try:
    import pymysql
    # Set version to satisfy Django's mysqlclient version check
    pymysql.version_info = (2, 2, 1, "final", 0)
    pymysql.install_as_MySQLdb()
except ImportError:
    pass  # mysqlclient will be used if PyMySQL is not available
