import { useState, useEffect } from 'react';
import { Button, Card, CardBody, FormCheck, Row, Col, Spinner } from 'react-bootstrap';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate, useParams } from 'react-router-dom';
import TextFormInput from '@/components/form/TextFormInput';
import TextAreaFormInput from '@/components/form/TextAreaFormInput';
import SelectFormInput from '@/components/form/SelectFormInput';
import ComponentContainerCard from '@/components/ComponentContainerCard';
import { useNotificationContext } from '@/context/useNotificationContext';
import httpClient from '@/helpers/httpClient';
import IconifyIcon from '@/components/wrappers/IconifyIcon';

const NewsForm = () => {
  const { id: uuid } = useParams();
  const isEdit = !!uuid;
  const navigate = useNavigate();
  const { showNotification } = useNotificationContext();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [existingImageUrl, setExistingImageUrl] = useState(null);

  const newsSchema = yup.object({
    title: yup.string().required('Title is required').max(200, 'Title must not exceed 200 characters'),
    slug: yup.string().required('Slug is required').max(200, 'Slug must not exceed 200 characters'),
    category_id: yup.number().nullable(),
    content: yup.string().required('Content is required'),
    excerpt: yup.string().max(500, 'Excerpt must not exceed 500 characters'),
    status: yup.string().oneOf(['draft', 'published', 'archived'], 'Invalid status').required('Status is required'),
    is_featured: yup.boolean(),
    published_at: yup.string().nullable(),
  });

  const { control, handleSubmit, formState: { errors }, setValue, watch } = useForm({
    resolver: yupResolver(newsSchema),
    defaultValues: {
      title: '',
      slug: '',
      category_id: null,
      content: '',
      excerpt: '',
      status: 'draft',
      is_featured: false,
      published_at: null,
    }
  });

  const title = watch('title');

  // Auto-generate slug from title
  useEffect(() => {
    if (title && !isEdit) {
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setValue('slug', slug);
    }
  }, [title, isEdit, setValue]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await httpClient.get('/news-categories/?is_active=true');
        setCategories((response.data.results || response.data).map(cat => ({
          value: cat.id,
          label: cat.name
        })));
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  // Fetch news data for editing
  useEffect(() => {
    if (isEdit) {
      const fetchNews = async () => {
        setLoading(true);
        try {
          const response = await httpClient.get(`/news/${uuid}/`);
          const news = response.data;
          setValue('title', news.title);
          setValue('slug', news.slug);
          // category_id is write-only, so get it from category object
          setValue('category_id', news.category?.id || null);
          setValue('content', news.content);
          setValue('excerpt', news.excerpt || '');
          setValue('status', news.status);
          setValue('is_featured', news.is_featured);
          setValue('published_at', news.published_at ? new Date(news.published_at).toISOString().split('T')[0] : null);
          if (news.featured_image_url) {
            setExistingImageUrl(news.featured_image_url);
          }
        } catch (error) {
          showNotification({ message: 'Failed to load news data.', variant: 'danger' });
          navigate('/news');
        } finally {
          setLoading(false);
        }
      };
      fetchNews();
    }
  }, [uuid, isEdit, setValue, navigate, showNotification]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (50KB max)
      if (file.size > 50 * 1024) {
        showNotification({ message: 'Image size cannot exceed 50KB.', variant: 'danger' });
        return;
      }
      // Validate file type
      if (!file.type.startsWith('image/')) {
        showNotification({ message: 'Please select a valid image file.', variant: 'danger' });
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setExistingImageUrl(null);
  };

  const onSubmit = handleSubmit(async (values) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', values.title);
      formData.append('slug', values.slug);
      if (values.category_id) {
        formData.append('category_id', values.category_id);
      }
      formData.append('content', values.content);
      if (values.excerpt) {
        formData.append('excerpt', values.excerpt);
      }
      formData.append('status', values.status);
      formData.append('is_featured', values.is_featured);
      if (values.published_at) {
        formData.append('published_at', new Date(values.published_at).toISOString());
      }
      if (imageFile) {
        formData.append('featured_image', imageFile);
      }

      let response;
      if (isEdit) {
        response = await httpClient.patch(`/news/${uuid}/`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        response = await httpClient.post('/news/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      showNotification({
        message: `News article ${isEdit ? 'updated' : 'created'} successfully!`,
        variant: 'success'
      });
      navigate('/news');
    } catch (error) {
      let errorMessage = `Failed to ${isEdit ? 'update' : 'create'} news article.`;
      if (error.response?.data) {
        if (error.response.data.details) {
          const details = error.response.data.details;
          if (typeof details === 'object') {
            errorMessage = Object.entries(details)
              .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
              .join('; ');
          } else {
            errorMessage = details;
          }
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error;
        }
      }
      showNotification({ message: errorMessage, variant: 'danger' });
    } finally {
      setLoading(false);
    }
  });

  if (loading && isEdit) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" />
        <p className="mt-2">Loading news data...</p>
      </div>
    );
  }

  return (
    <ComponentContainerCard
      title={isEdit ? 'Edit News Article' : 'Create News Article'}
      description={isEdit ? 'Update news article information and content.' : 'Create a new news article.'}
    >
      <form onSubmit={onSubmit}>
        <Row>
          <Col md={8}>
            <Card className="mb-3">
              <CardBody>
                <TextFormInput
                  control={control}
                  name="title"
                  label="Title *"
                  placeholder="Enter news title"
                  containerClassName="mb-3"
                />

                <TextFormInput
                  control={control}
                  name="slug"
                  label="Slug *"
                  placeholder="URL-friendly identifier (auto-generated from title)"
                  containerClassName="mb-3"
                  helpText="This will be used in the URL: /news/your-slug"
                />

                <TextAreaFormInput
                  control={control}
                  name="excerpt"
                  label="Excerpt"
                  placeholder="Short summary (max 500 characters)"
                  rows={3}
                  containerClassName="mb-3"
                  helpText="Brief summary of the news article"
                />

                <TextAreaFormInput
                  control={control}
                  name="content"
                  label="Content *"
                  placeholder="Enter full article content"
                  rows={10}
                  containerClassName="mb-3"
                />

                <SelectFormInput
                  control={control}
                  name="category_id"
                  label="Category"
                  options={[{ value: null, label: 'No Category' }, ...categories]}
                  containerClassName="mb-3"
                  placeholder="Select a category"
                />
              </CardBody>
            </Card>

            <Card className="mb-3">
              <CardBody>
                <h5 className="mb-3">Featured Image</h5>
                <div className="mb-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="form-control"
                  />
                  <small className="text-muted">Max size: 50KB. Supported formats: JPG, PNG, GIF</small>
                </div>

                {(imagePreview || existingImageUrl) && (
                  <div className="mb-3">
                    <img
                      src={imagePreview || existingImageUrl}
                      alt="Preview"
                      style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain' }}
                      className="border rounded p-2"
                    />
                    <Button
                      variant="danger"
                      size="sm"
                      className="mt-2"
                      onClick={removeImage}
                    >
                      <IconifyIcon icon="solar:trash-bin-minimalistic-bold-duotone" width={16} height={16} className="me-1" />
                      Remove Image
                    </Button>
                  </div>
                )}
              </CardBody>
            </Card>
          </Col>

          <Col md={4}>
            <Card className="mb-3">
              <CardBody>
                <h5 className="mb-3">Status & Settings</h5>

                <SelectFormInput
                  control={control}
                  name="status"
                  label="Status *"
                  options={[
                    { value: 'draft', label: 'Draft' },
                    { value: 'published', label: 'Published' },
                    { value: 'archived', label: 'Archived' }
                  ]}
                  containerClassName="mb-3"
                />

                <div className="mb-3">
                  <Controller
                    name="is_featured"
                    control={control}
                    render={({ field }) => (
                      <FormCheck
                        type="checkbox"
                        label="Feature this news on homepage"
                        checked={field.value || false}
                        onChange={(e) => field.onChange(e.target.checked)}
                      />
                    )}
                  />
                </div>

                <TextFormInput
                  control={control}
                  name="published_at"
                  label="Published Date"
                  type="date"
                  containerClassName="mb-3"
                  helpText="Leave empty to use current date when published"
                />
              </CardBody>
            </Card>
          </Col>
        </Row>

        <div className="d-flex justify-content-end gap-2">
          <Button variant="secondary" onClick={() => navigate('/news')}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? <><Spinner size="sm" className="me-2" />Saving...</> : (isEdit ? 'Update News' : 'Create News')}
          </Button>
        </div>
      </form>
    </ComponentContainerCard>
  );
};

export default NewsForm;

