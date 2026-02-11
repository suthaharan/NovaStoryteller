import { useState, useEffect, useRef } from 'react';
import { Button, Card, CardBody, Row, Col, Spinner } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate } from 'react-router-dom';
import TextFormInput from '@/components/form/TextFormInput';
import ComponentContainerCard from '@/components/ComponentContainerCard';
import { useNotificationContext } from '@/context/useNotificationContext';
import httpClient from '@/helpers/httpClient';
import IconifyIcon from '@/components/wrappers/IconifyIcon';

const ProfileForm = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotificationContext();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [existingImageUrl, setExistingImageUrl] = useState(null);
  const fetchingRef = useRef(false);

  const profileSchema = yup.object({
    title: yup.string().max(100, 'Title must not exceed 100 characters'),
    contact_phone: yup.string().max(20, 'Contact phone must not exceed 20 characters'),
    business_name: yup.string().max(200, 'Business name must not exceed 200 characters'),
    first_name: yup.string().max(150, 'First name must not exceed 150 characters'),
    last_name: yup.string().max(150, 'Last name must not exceed 150 characters'),
  });

  const { control, handleSubmit, formState: { errors }, setValue } = useForm({
    resolver: yupResolver(profileSchema),
    defaultValues: {
      title: '',
      contact_phone: '',
      business_name: '',
      first_name: '',
      last_name: '',
    }
  });

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (fetchingRef.current) return;
      fetchingRef.current = true;
      
      setFetching(true);
      try {
        const response = await httpClient.get('/profile/');
        const profile = response.data;
        
        setValue('title', profile.title || '');
        setValue('contact_phone', profile.contact_phone || '');
        setValue('business_name', profile.business_name || '');
        setValue('first_name', profile.user_first_name || '');
        setValue('last_name', profile.user_last_name || '');
        
        if (profile.avatar_url) {
          setExistingImageUrl(profile.avatar_url);
        }
      } catch (error) {
        // Ignore canceled errors (from request throttling)
        if (error.code === 'ERR_CANCELED' || error.name === 'CanceledError') {
          return;
        }
        console.error('Error fetching profile:', error);
        showNotification({ 
          message: 'Failed to load profile data.', 
          variant: 'danger' 
        });
      } finally {
        setFetching(false);
        fetchingRef.current = false;
      }
    };
    fetchProfile();
  }, [setValue, showNotification]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (50KB max)
      if (file.size > 50 * 1024) {
        showNotification({ message: 'Avatar size cannot exceed 50KB.', variant: 'danger' });
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
      // Only append non-empty values
      if (values.title && values.title.trim()) {
        formData.append('title', values.title.trim());
      }
      if (values.contact_phone && values.contact_phone.trim()) {
        formData.append('contact_phone', values.contact_phone.trim());
      }
      if (values.business_name && values.business_name.trim()) {
        formData.append('business_name', values.business_name.trim());
      }
      if (values.first_name && values.first_name.trim()) {
        formData.append('first_name', values.first_name.trim());
      }
      if (values.last_name && values.last_name.trim()) {
        formData.append('last_name', values.last_name.trim());
      }
      if (imageFile) {
        formData.append('avatar', imageFile);
      }

      await httpClient.patch('/profile/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      showNotification({
        message: 'Profile updated successfully!',
        variant: 'success'
      });
      
      // Refresh avatar preview if uploaded
      if (imageFile) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result);
          setExistingImageUrl(reader.result);
        };
        reader.readAsDataURL(imageFile);
      }
      
      // Fetch updated profile to get new avatar URL
      try {
        const response = await httpClient.get('/profile/');
        const updatedProfile = response.data;
        if (updatedProfile.avatar_url) {
          setExistingImageUrl(updatedProfile.avatar_url);
        }
        
        // Dispatch custom event to notify ProfileDropdown to refresh
        window.dispatchEvent(new CustomEvent('profileUpdated', { 
          detail: { profile: updatedProfile } 
        }));
      } catch (err) {
        // Ignore errors on refresh, but still dispatch event
        window.dispatchEvent(new CustomEvent('profileUpdated'));
      }
    } catch (error) {
      // Ignore canceled errors
      if (error.code === 'ERR_CANCELED' || error.name === 'CanceledError') {
        return;
      }
      
      let errorMessage = 'Failed to update profile.';
      if (error.response?.data) {
        if (error.response.data.error) {
          errorMessage = error.response.data.error;
        } else if (error.response.data.details) {
          // Handle validation errors
          const details = error.response.data.details;
          if (typeof details === 'object') {
            const firstError = Object.values(details)[0];
            errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
          } else {
            errorMessage = details;
          }
        } else if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        }
      }
      showNotification({ message: errorMessage, variant: 'danger' });
    } finally {
      setLoading(false);
    }
  });

  if (fetching) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <ComponentContainerCard title="Profile Settings" subtitle="Manage your profile information">
      <form onSubmit={onSubmit}>
        <Row>
          <Col md={8}>
            <Card className="mb-3">
              <CardBody>
                <h5 className="mb-3">Personal Information</h5>
                
                <TextFormInput
                  control={control}
                  name="first_name"
                  label="First Name"
                  containerClassName="mb-3"
                  placeholder="Enter your first name"
                />

                <TextFormInput
                  control={control}
                  name="last_name"
                  label="Last Name"
                  containerClassName="mb-3"
                  placeholder="Enter your last name"
                />

                <TextFormInput
                  control={control}
                  name="title"
                  label="Title"
                  containerClassName="mb-3"
                  placeholder="e.g., Mr., Mrs., Dr., Prof."
                  helpText="Your professional or personal title"
                />

                <TextFormInput
                  control={control}
                  name="contact_phone"
                  label="Contact Phone"
                  containerClassName="mb-3"
                  placeholder="e.g., +1-555-123-4567"
                  helpText="Your contact phone number"
                />

                <TextFormInput
                  control={control}
                  name="business_name"
                  label="Business Name"
                  containerClassName="mb-3"
                  placeholder="Enter your business or company name"
                  helpText="Your business or company name"
                />
              </CardBody>
            </Card>

            <Card className="mb-3">
              <CardBody>
                <h5 className="mb-3">Avatar</h5>
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
                      alt="Avatar Preview"
                      style={{ maxWidth: '200px', maxHeight: '200px', objectFit: 'cover', borderRadius: '50%' }}
                      className="border rounded-circle p-2"
                    />
                    <br />
                    <Button
                      variant="danger"
                      size="sm"
                      className="mt-2"
                      onClick={removeImage}
                    >
                      <IconifyIcon icon="solar:trash-bin-minimalistic-bold-duotone" width={16} height={16} className="me-1" />
                      Remove Avatar
                    </Button>
                  </div>
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>

        <div className="d-flex gap-2">
          <Button
            type="submit"
            variant="primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Saving...
              </>
            ) : (
              <>
                <IconifyIcon icon="solar:diskette-bold-duotone" width={16} height={16} className="me-1" />
                Save Changes
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate(-1)}
            disabled={loading}
          >
            Cancel
          </Button>
        </div>
      </form>
    </ComponentContainerCard>
  );
};

export default ProfileForm;

