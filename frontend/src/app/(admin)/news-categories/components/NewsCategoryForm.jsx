import { useState, useEffect } from 'react';
import { Button, Card, CardBody, Row, Col, Spinner } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate, useParams } from 'react-router-dom';
import TextFormInput from '@/components/form/TextFormInput';
import TextAreaFormInput from '@/components/form/TextAreaFormInput';
import ComponentContainerCard from '@/components/ComponentContainerCard';
import { useNotificationContext } from '@/context/useNotificationContext';
import httpClient from '@/helpers/httpClient';
import IconifyIcon from '@/components/wrappers/IconifyIcon';

const NewsCategoryForm = () => {
  const { id: uuid } = useParams();
  const isEdit = !!uuid;
  const navigate = useNavigate();
  const { showNotification } = useNotificationContext();
  const [loading, setLoading] = useState(false);

  const categorySchema = yup.object({
    name: yup.string().required('Name is required').max(100, 'Name must not exceed 100 characters'),
    slug: yup.string().required('Slug is required').max(100, 'Slug must not exceed 100 characters'),
    description: yup.string().max(500, 'Description must not exceed 500 characters'),
    is_active: yup.boolean(),
  });

  const { control, handleSubmit, formState: { errors }, setValue, watch } = useForm({
    resolver: yupResolver(categorySchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      is_active: true,
    }
  });

  const name = watch('name');

  // Auto-generate slug from name
  useEffect(() => {
    if (name && !isEdit) {
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setValue('slug', slug);
    }
  }, [name, isEdit, setValue]);

  // Fetch category data for editing
  useEffect(() => {
    if (isEdit) {
      const fetchCategory = async () => {
        setLoading(true);
        try {
          const response = await httpClient.get(`/news-categories/${uuid}/`);
          const category = response.data;
          setValue('name', category.name);
          setValue('slug', category.slug);
          setValue('description', category.description || '');
          setValue('is_active', category.is_active);
        } catch (error) {
          showNotification({ message: 'Failed to load category data.', variant: 'danger' });
          navigate('/news-categories');
        } finally {
          setLoading(false);
        }
      };
      fetchCategory();
    }
  }, [uuid, isEdit, setValue, navigate, showNotification]);

  const onSubmit = handleSubmit(async (values) => {
    setLoading(true);
    try {
      if (isEdit) {
        await httpClient.put(`/news-categories/${uuid}/`, values);
        showNotification({ message: 'Category updated successfully.', variant: 'success' });
      } else {
        await httpClient.post('/news-categories/', values);
        showNotification({ message: 'Category created successfully.', variant: 'success' });
      }
      navigate('/news-categories');
    } catch (error) {
      const message = error.response?.data?.detail || error.response?.data?.message || 
        (isEdit ? 'Failed to update category.' : 'Failed to create category.');
      showNotification({ message, variant: 'danger' });
    } finally {
      setLoading(false);
    }
  });

  if (loading && isEdit) {
    return (
      <ComponentContainerCard title={isEdit ? 'Edit News Category' : 'Create News Category'}>
        <div className="text-center py-5">
          <Spinner animation="border" />
          <p className="mt-2">Loading...</p>
        </div>
      </ComponentContainerCard>
    );
  }

  return (
    <ComponentContainerCard 
      title={isEdit ? 'Edit News Category' : 'Create News Category'}
      description={isEdit ? 'Update news category information.' : 'Create a new news category.'}
    >
      <Card>
        <CardBody>
          <form onSubmit={onSubmit}>
            <Row>
              <Col md={6}>
                <TextFormInput
                  name="name"
                  label="Category Name"
                  control={control}
                  errors={errors}
                  placeholder="Enter category name"
                />
              </Col>
              <Col md={6}>
                <TextFormInput
                  name="slug"
                  label="Slug"
                  control={control}
                  errors={errors}
                  placeholder="category-slug"
                />
              </Col>
            </Row>
            <Row className="mt-3">
              <Col md={12}>
                <TextAreaFormInput
                  name="description"
                  label="Description"
                  control={control}
                  errors={errors}
                  placeholder="Enter category description (optional)"
                  rows={4}
                />
              </Col>
            </Row>
            <Row className="mt-3">
              <Col md={12}>
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="is_active"
                    checked={watch('is_active')}
                    onChange={(e) => setValue('is_active', e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="is_active">
                    Active
                  </label>
                </div>
              </Col>
            </Row>
            <Row className="mt-4">
              <Col>
                <Button type="submit" variant="primary" disabled={loading}>
                  {loading ? (
                    <>
                      <Spinner size="sm" className="me-2" />
                      {isEdit ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <IconifyIcon icon="solar:check-circle-bold-duotone" width={20} height={20} className="me-1" />
                      {isEdit ? 'Update Category' : 'Create Category'}
                    </>
                  )}
                </Button>
                <Button type="button" variant="outline-secondary" className="ms-2" onClick={() => navigate('/news-categories')}>
                  Cancel
                </Button>
              </Col>
            </Row>
          </form>
        </CardBody>
      </Card>
    </ComponentContainerCard>
  );
};

export default NewsCategoryForm;


