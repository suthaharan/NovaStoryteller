import { useState, useEffect } from 'react';
import { Button, Card, CardBody, FormCheck, Row, Col, Spinner, Alert } from 'react-bootstrap';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate, useParams } from 'react-router-dom';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import TextFormInput from '@/components/form/TextFormInput';
import SelectFormInput from '@/components/form/SelectFormInput';
import ComponentContainerCard from '@/components/ComponentContainerCard';
import { useNotificationContext } from '@/context/useNotificationContext';
import httpClient from '@/helpers/httpClient';
import IconifyIcon from '@/components/wrappers/IconifyIcon';

const PageForm = () => {
  const { id: uuid } = useParams();
  const isEdit = !!uuid;
  const navigate = useNavigate();
  const { showNotification } = useNotificationContext();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [existingImageUrl, setExistingImageUrl] = useState(null);

  const pageSchema = yup.object({
    title: yup.string().required('Title is required').max(200, 'Title must not exceed 200 characters'),
    slug: yup.string().required('Slug is required').max(200, 'Slug must not exceed 200 characters'),
    category_id: yup.number().nullable(),
    description: yup.string().required('Description is required'),
    status: yup.string().oneOf(['draft', 'published', 'archived'], 'Invalid status').required('Status is required'),
    is_featured: yup.boolean(),
    published_at: yup.string().nullable(),
  });

  const { control, handleSubmit, formState: { errors }, setValue, watch } = useForm({
    resolver: yupResolver(pageSchema),
    defaultValues: {
      title: '',
      slug: '',
      category_id: null,
      description: '',
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
        const response = await httpClient.get('/page-categories/?is_active=true');
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

  // Fetch page data for editing
  useEffect(() => {
    if (isEdit) {
      const fetchPage = async () => {
        setLoading(true);
        try {
          const response = await httpClient.get(`/pages/${uuid}/`);
          const page = response.data;
          setValue('title', page.title);
          setValue('slug', page.slug);
          // category_id is write-only, so get it from category object
          setValue('category_id', page.category?.id || null);
          setValue('description', page.description);
          setValue('status', page.status);
          setValue('is_featured', page.is_featured);
          setValue('published_at', page.published_at ? new Date(page.published_at).toISOString().split('T')[0] : null);
          if (page.featured_image_url) {
            setExistingImageUrl(page.featured_image_url);
          }
        } catch (error) {
          showNotification({ message: 'Failed to load page data.', variant: 'danger' });
          navigate('/pages');
        } finally {
          setLoading(false);
        }
      };
      fetchPage();
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
      formData.append('description', values.description);
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
        response = await httpClient.patch(`/pages/${uuid}/`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        response = await httpClient.post('/pages/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      showNotification({
        message: `Page ${isEdit ? 'updated' : 'created'} successfully!`,
        variant: 'success'
      });
      navigate('/pages');
    } catch (error) {
      let errorMessage = `Failed to ${isEdit ? 'update' : 'create'} page.`;
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

  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      [{ 'align': [] }],
      ['link', 'image'],
      ['clean']
    ]
  };

  if (loading && isEdit) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" />
        <p className="mt-2">Loading page data...</p>
      </div>
    );
  }

  return (
    <ComponentContainerCard
      title={isEdit ? 'Edit Page' : 'Create Page'}
      description={isEdit ? 'Update page information and content.' : 'Create a new static content page.'}
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
                  placeholder="Enter page title"
                  containerClassName="mb-3"
                />

                <TextFormInput
                  control={control}
                  name="slug"
                  label="Slug *"
                  placeholder="URL-friendly identifier (auto-generated from title)"
                  containerClassName="mb-3"
                  helpText="This will be used in the URL: /page/your-slug"
                />

                <div className="mb-3">
                  <label className="form-label">Description (Rich Text) *</label>
                  <Controller
                    name="description"
                    control={control}
                    render={({ field, fieldState }) => (
                      <>
                        <ReactQuill
                          theme="snow"
                          modules={quillModules}
                          value={field.value || ''}
                          onChange={field.onChange}
                          style={{ height: '300px', marginBottom: '50px' }}
                        />
                        {fieldState.error && (
                          <div className="text-danger small mt-1">{fieldState.error.message}</div>
                        )}
                      </>
                    )}
                  />
                </div>

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
                        label="Feature this page on homepage"
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
          <Button variant="secondary" onClick={() => navigate('/pages')}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? <><Spinner size="sm" className="me-2" />Saving...</> : (isEdit ? 'Update Page' : 'Create Page')}
          </Button>
        </div>
      </form>
    </ComponentContainerCard>
  );
};

export default PageForm;

