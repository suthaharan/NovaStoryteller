import { useState, useEffect, useRef } from 'react';
import { Button, Card, CardBody, Row, Col, Spinner } from 'react-bootstrap';
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

const FAQForm = () => {
  const params = useParams();
  const uuid = params?.id || params?.uuid; // Support both :id and :uuid route params
  const isEdit = !!uuid;
  
  // Debug: Log UUID on mount
  useEffect(() => {
    console.log('FAQ Form - Params:', params);
    console.log('FAQ Form - UUID:', uuid);
    console.log('FAQ Form - Is Edit:', isEdit);
    if (isEdit && uuid) {
      console.log('FAQ Edit - UUID from URL:', uuid);
      // Validate UUID format (basic check)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(uuid)) {
        console.error('Invalid UUID format:', uuid);
      }
    }
  }, [params, uuid, isEdit]);
  const navigate = useNavigate();
  const { showNotification } = useNotificationContext();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const fetchingRef = useRef(false);

  const faqSchema = yup.object({
    question: yup.string().required('Question is required').max(500, 'Question must not exceed 500 characters'),
    answer: yup.string().required('Answer is required'),
    category_id: yup.number().nullable(),
    status: yup.string().oneOf(['draft', 'published', 'archived'], 'Invalid status').required('Status is required'),
    display_order: yup.number().min(0, 'Display order must be 0 or greater').nullable(),
  });

  const { control, handleSubmit, formState: { errors }, setValue, watch } = useForm({
    resolver: yupResolver(faqSchema),
    defaultValues: {
      question: '',
      answer: '',
      category_id: null,
      status: 'draft',
      display_order: 0,
    }
  });

  const question = watch('question');

  // Auto-generate slug from question
  useEffect(() => {
    if (question && !isEdit) {
      const slug = question
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
        .substring(0, 240); // Limit to 240 chars for MySQL compatibility
      setValue('slug', slug);
    }
  }, [question, isEdit, setValue]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await httpClient.get('/faq-categories/?is_active=true');
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

  // Fetch FAQ data for editing
  useEffect(() => {
    if (isEdit && uuid) {
      const fetchFAQ = async () => {
        // Prevent duplicate calls
        if (fetchingRef.current) return;
        fetchingRef.current = true;
        
        setLoading(true);
        try {
          // Ensure UUID is properly formatted and endpoint has trailing slash
          const cleanUuid = uuid.trim();
          console.log('Fetching FAQ with UUID:', cleanUuid);
          console.log('API Endpoint:', `/faqs/${cleanUuid}/`);
          
          const response = await httpClient.get(`/faqs/${cleanUuid}/`);
          console.log('FAQ Response:', response.data);
          const faq = response.data;
          
          if (!faq) {
            throw new Error('FAQ not found');
          }
          
          setValue('question', faq.question || '');
          setValue('slug', faq.slug || '');
          // category_id is write-only, so get it from category object
          setValue('category_id', faq.category?.id || null);
          setValue('answer', faq.answer || '');
          setValue('status', faq.status || 'draft');
          setValue('display_order', faq.display_order || 0);
        } catch (error) {
          console.error('Error fetching FAQ:', error);
          console.error('Error response:', error.response);
          console.error('Error status:', error.response?.status);
          console.error('Error data:', error.response?.data);
          
          // Ignore cancelled/aborted errors (from request throttling)
          if (error.name === 'AbortError' || error.code === 'ERR_CANCELED' || error.message?.includes('cancelled')) {
            console.log('Request was cancelled, ignoring error');
            return;
          }
          
          const errorMessage = error.response?.data?.detail || 
                              error.response?.data?.message || 
                              error.message || 
                              'Failed to load FAQ data.';
          
          // Only show error and redirect if it's a real error (not 404 from cancelled request)
          if (error.response?.status === 404) {
            showNotification({ 
              message: 'FAQ not found. It may have been deleted.', 
              variant: 'warning' 
            });
            setTimeout(() => navigate('/faqs'), 2000);
          } else if (error.response?.status >= 500) {
            showNotification({ 
              message: 'Server error. Please try again later.', 
              variant: 'danger' 
            });
            // Don't redirect on server errors, let user retry
          } else {
            showNotification({ 
              message: `Error: ${errorMessage}`, 
              variant: 'danger' 
            });
            // Only redirect on client errors (400-499) that aren't 404
            if (error.response?.status >= 400 && error.response?.status < 500) {
              setTimeout(() => navigate('/faqs'), 3000);
            }
          }
        } finally {
          setLoading(false);
          fetchingRef.current = false;
        }
      };
      fetchFAQ();
    } else if (isEdit && !uuid) {
      // If edit mode but no UUID, redirect immediately
      showNotification({ message: 'Invalid FAQ ID.', variant: 'danger' });
      navigate('/faqs');
    }
  }, [uuid, isEdit, setValue, navigate, showNotification]);

  const onSubmit = handleSubmit(async (values) => {
    setLoading(true);
    try {
      const data = {
        question: values.question,
        slug: values.slug || values.question.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').substring(0, 240),
        answer: values.answer,
        category_id: values.category_id || null,
        status: values.status,
        display_order: values.display_order || 0,
      };

      let response;
      if (isEdit) {
        response = await httpClient.patch(`/faqs/${uuid}/`, data);
      } else {
        response = await httpClient.post('/faqs/', data);
      }

      showNotification({
        message: `FAQ ${isEdit ? 'updated' : 'created'} successfully!`,
        variant: 'success'
      });
      navigate('/faqs');
    } catch (error) {
      let errorMessage = `Failed to ${isEdit ? 'update' : 'create'} FAQ.`;
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
        <p className="mt-2">Loading FAQ data...</p>
      </div>
    );
  }

  return (
    <ComponentContainerCard
      title={isEdit ? 'Edit FAQ' : 'Create FAQ'}
      description={isEdit ? 'Update FAQ information and content.' : 'Create a new frequently asked question.'}
    >
      <form onSubmit={onSubmit}>
        <Row>
          <Col md={8}>
            <Card className="mb-3">
              <CardBody>
                <TextFormInput
                  control={control}
                  name="question"
                  label="Question *"
                  placeholder="Enter the question"
                  containerClassName="mb-3"
                />

                <TextAreaFormInput
                  control={control}
                  name="answer"
                  label="Answer *"
                  placeholder="Enter the detailed answer"
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

                <TextFormInput
                  control={control}
                  name="display_order"
                  label="Display Order"
                  type="number"
                  min="0"
                  containerClassName="mb-3"
                  helpText="Lower numbers appear first (default: 0)"
                />
              </CardBody>
            </Card>
          </Col>
        </Row>

        <div className="d-flex justify-content-end gap-2">
          <Button variant="secondary" onClick={() => navigate('/faqs')}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? <><Spinner size="sm" className="me-2" />Saving...</> : (isEdit ? 'Update FAQ' : 'Create FAQ')}
          </Button>
        </div>
      </form>
    </ComponentContainerCard>
  );
};

export default FAQForm;

