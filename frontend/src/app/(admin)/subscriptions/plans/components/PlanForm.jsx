import { useState, useEffect } from 'react';
import { Button, Card, CardBody, Row, Col, Spinner, FormCheck, FormControl } from 'react-bootstrap';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate, useParams } from 'react-router-dom';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import TextFormInput from '@/components/form/TextFormInput';
import ComponentContainerCard from '@/components/ComponentContainerCard';
import { useNotificationContext } from '@/context/useNotificationContext';
import httpClient from '@/helpers/httpClient';
import IconifyIcon from '@/components/wrappers/IconifyIcon';
import { getCookie } from 'cookies-next';

const PlanForm = () => {
  const { uuid } = useParams();
  const isEdit = !!uuid;
  const navigate = useNavigate();
  const { showNotification } = useNotificationContext();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);

  const planSchema = yup.object({
    name: yup.string().required('Name is required').max(100, 'Name must not exceed 100 characters'),
    description: yup.string(),
    price: yup.number().required('Price is required').min(0, 'Price must be 0 or greater'),
    duration_months: yup.number().required('Duration is required').min(1, 'Duration must be at least 1 month'),
    features: yup.array().of(yup.string()),
    is_popular: yup.boolean(),
    is_active: yup.boolean(),
    display_order: yup.number().min(0, 'Display order must be 0 or greater'),
  });

  // Quill editor modules
  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      ['link', 'image'],
      ['clean']
    ],
  };

  const { control, handleSubmit, formState: { errors }, setValue, watch } = useForm({
    resolver: yupResolver(planSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      duration_months: 1,
      features: [],
      is_popular: false,
      is_active: true,
      display_order: 0,
    }
  });

  const [features, setFeatures] = useState(['']);
  const [isStaff, setIsStaff] = useState(null); // null = checking, true = staff, false = not staff

  // Check if user is staff - redirect if not
  useEffect(() => {
    const checkStaff = () => {
      try {
        const authCookie = getCookie('_Ace_AUTH_KEY_');
        if (authCookie) {
          const userData = typeof authCookie === 'string' ? JSON.parse(authCookie) : authCookie;
          const staffStatus = userData?.role === 'Admin' || userData?.is_staff === true;
          setIsStaff(staffStatus);
          if (!staffStatus) {
            showNotification({ message: 'Access denied. Staff only.', variant: 'danger' });
            navigate('/subscriptions/my-plan');
          }
        } else {
          setIsStaff(false);
          navigate('/subscriptions/my-plan');
        }
      } catch (e) {
        console.warn('Failed to parse auth cookie:', e);
        setIsStaff(false);
        navigate('/subscriptions/my-plan');
      }
    };
    checkStaff();
  }, [navigate, showNotification]);

  // Don't render until staff check is complete, or if not staff
  if (isStaff === false) {
    return null;
  }

  if (isStaff === null) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" />
        <p className="mt-2">Checking permissions...</p>
      </div>
    );
  }

  useEffect(() => {
    if (isEdit && uuid) {
      const fetchPlan = async () => {
        setFetching(true);
        try {
          const response = await httpClient.get(`/plans/${uuid}/`);
          const plan = response.data;
          
          setValue('name', plan.name || '');
          setValue('description', plan.description || '');
          setValue('price', plan.price || 0);
          setValue('duration_months', plan.duration_months || 1);
          setValue('is_popular', plan.is_popular || false);
          setValue('is_active', plan.is_active !== undefined ? plan.is_active : true);
          setValue('display_order', plan.display_order || 0);
          
          if (plan.features && Array.isArray(plan.features) && plan.features.length > 0) {
            setFeatures(plan.features);
            setValue('features', plan.features);
          } else {
            setFeatures(['']);
            setValue('features', []);
          }
        } catch (error) {
          if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
            return;
          }
          console.error('Error fetching plan:', error);
          showNotification({ message: 'Failed to load plan data.', variant: 'danger' });
          navigate('/subscriptions/plans');
        } finally {
          setFetching(false);
        }
      };
      fetchPlan();
    }
  }, [isEdit, uuid, setValue, navigate, showNotification]);

  const addFeature = () => {
    setFeatures([...features, '']);
  };

  const removeFeature = (index) => {
    const newFeatures = features.filter((_, i) => i !== index);
    setFeatures(newFeatures);
    setValue('features', newFeatures.filter(f => f.trim() !== ''));
  };

  const updateFeature = (index, value) => {
    const newFeatures = [...features];
    newFeatures[index] = value;
    setFeatures(newFeatures);
    setValue('features', newFeatures.filter(f => f.trim() !== ''));
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const payload = {
        ...data,
        features: data.features.filter(f => f && f.trim() !== ''),
      };

      if (isEdit) {
        await httpClient.put(`/plans/${uuid}/`, payload);
        showNotification({ message: 'Plan updated successfully.', variant: 'success' });
      } else {
        await httpClient.post('/plans/', payload);
        showNotification({ message: 'Plan created successfully.', variant: 'success' });
      }
      navigate('/subscriptions/plans');
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
                          (error.response?.data && typeof error.response.data === 'object' 
                            ? Object.values(error.response.data).flat().join(', ') 
                            : 'Failed to save plan.');
      showNotification({ message: errorMessage, variant: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" />
        <p className="mt-2">Loading plan data...</p>
      </div>
    );
  }

  return (
    <ComponentContainerCard
      title={isEdit ? 'Edit Plan' : 'Create Plan'}
      description={isEdit ? 'Update plan information.' : 'Create a new subscription plan.'}
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <Row>
          <Col md={8}>
            <Card className="mb-3">
              <CardBody>
                <TextFormInput
                  control={control}
                  name="name"
                  label="Plan Name *"
                  placeholder="Enter plan name"
                  containerClassName="mb-3"
                />

                <div className="mb-3">
                  <label className="form-label">Description (Rich Text)</label>
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

                <Row>
                  <Col md={6}>
                    <TextFormInput
                      control={control}
                      name="price"
                      label="Price (USD) *"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      containerClassName="mb-3"
                    />
                  </Col>
                  <Col md={6}>
                    <TextFormInput
                      control={control}
                      name="duration_months"
                      label="Duration (Months) *"
                      type="number"
                      min="1"
                      placeholder="1"
                      containerClassName="mb-3"
                      helpText="1 for monthly, 12 for yearly"
                    />
                  </Col>
                </Row>

                <TextFormInput
                  control={control}
                  name="display_order"
                  label="Display Order"
                  type="number"
                  min="0"
                  placeholder="0"
                  containerClassName="mb-3"
                  helpText="Lower numbers appear first"
                />

                <div className="mb-3">
                  <label className="form-label">Features</label>
                  {features.map((feature, index) => (
                    <div key={index} className="d-flex mb-2">
                      <FormControl
                        value={feature}
                        onChange={(e) => updateFeature(index, e.target.value)}
                        placeholder="Enter feature"
                        className="me-2"
                      />
                      {features.length > 1 && (
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => removeFeature(index)}
                          type="button"
                        >
                          <IconifyIcon icon="solar:trash-bin-minimalistic-bold-duotone" width={16} height={16} />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={addFeature}
                    type="button"
                  >
                    <IconifyIcon icon="solar:add-circle-bold-duotone" width={16} height={16} className="me-1" />
                    Add Feature
                  </Button>
                </div>
              </CardBody>
            </Card>
          </Col>

          <Col md={4}>
            <Card className="mb-3">
              <CardBody>
                <h6 className="mb-3">Settings</h6>
                
                <Controller
                  name="is_popular"
                  control={control}
                  render={({ field }) => (
                    <FormCheck
                      type="switch"
                      id="is_popular"
                      label="Mark as Popular"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                      className="mb-3"
                    />
                  )}
                />

                <Controller
                  name="is_active"
                  control={control}
                  render={({ field }) => (
                    <FormCheck
                      type="switch"
                      id="is_active"
                      label="Active"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
                  )}
                />
              </CardBody>
            </Card>
          </Col>
        </Row>

        <div className="d-flex gap-2">
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? <><Spinner size="sm" className="me-2" />Saving...</> : (isEdit ? 'Update Plan' : 'Create Plan')}
          </Button>
          <Button variant="secondary" type="button" onClick={() => navigate('/subscriptions/plans')}>
            Cancel
          </Button>
        </div>
      </form>
    </ComponentContainerCard>
  );
};

export default PlanForm;

