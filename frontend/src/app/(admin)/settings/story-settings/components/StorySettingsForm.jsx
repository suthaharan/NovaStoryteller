import { useState, useEffect } from 'react';
import { Card, Col, Row, Form, Button, Spinner, Alert } from 'react-bootstrap';
import httpClient from '@/helpers/httpClient';
import PageBreadcrumb from '@/components/layout/PageBreadcrumb';
import ComponentContainerCard from '@/components/ComponentContainerCard';
import { crudToasts, handleApiError } from '@/utils/toastNotifications';
import IconifyIcon from '@/components/wrappers/IconifyIcon';

const StorySettingsForm = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState(null);
  const [errors, setErrors] = useState({});

  const ageRanges = [
    { value: '3-5', label: '3-5 years (Simple tales, 200-300 words)' },
    { value: '6-8', label: '6-8 years (Adventures with lessons, 400-500 words)' },
    { value: '9-12', label: '9-12 years (Complex plots, 600-700 words)' },
  ];

  const genrePreferences = [
    { value: 'fantasy', label: 'Fantasy' },
    { value: 'adventure', label: 'Adventure' },
    { value: 'sci-fi', label: 'Science Fiction' },
    { value: 'mystery', label: 'Mystery' },
    { value: 'educational', label: 'Educational' },
    { value: 'mixed', label: 'Mixed (Fantasy, Adventure, Real-world)' },
  ];

  const languageLevels = [
    { value: 'simple', label: 'Simple (Basic words, short sentences)' },
    { value: 'moderate', label: 'Moderate (Some complexity, explain new words)' },
    { value: 'advanced', label: 'Advanced (Rich vocabulary, complex sentences)' },
  ];

  const moralThemes = [
    { value: 'friendship', label: 'Friendship' },
    { value: 'kindness', label: 'Kindness' },
    { value: 'bravery', label: 'Bravery' },
    { value: 'curiosity', label: 'Curiosity' },
    { value: 'teamwork', label: 'Teamwork' },
    { value: 'growth', label: 'Growth & Learning' },
    { value: 'empathy', label: 'Empathy' },
    { value: 'mixed', label: 'Mixed (Various positive themes)' },
  ];

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await httpClient.get('/story-settings/');
      setSettings(response.data);
    } catch (err) {
      console.error('Error fetching settings:', err);
      handleApiError(err, { item: 'Story settings', action: 'fetch', defaultMessage: 'Failed to fetch story settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});

    try {
      await httpClient.patch('/story-settings/', settings);
      crudToasts.saved('Story settings');
    } catch (err) {
      console.error('Error saving settings:', err);
      if (err.response?.data) {
        setErrors(err.response.data);
        handleApiError(err, { item: 'Settings', action: 'save', defaultMessage: 'Failed to save settings. Please check the form for errors.' });
      } else {
        crudToasts.saveError(err, 'Story settings');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  if (!settings) {
    return (
      <Alert variant="danger">
        Failed to load story settings. Please refresh the page.
      </Alert>
    );
  }

  return (
    <>
      <PageBreadcrumb title="Story Settings" subName="Settings" />
      <Row>
        <Col xs={12}>
          <ComponentContainerCard title="Story Generation Settings">
            <Alert variant="info" className="mb-4">
              <IconifyIcon icon="solar:info-circle-bold" width={20} height={20} className="me-2" />
              These settings will be applied to all stories you create. They influence the age-appropriateness, 
              language complexity, themes, and structure of your stories.
            </Alert>

            <Form onSubmit={handleSubmit}>
              {/* Age Range Section */}
              <Card className="mb-4">
                <Card.Header>
                  <h5 className="mb-0">
                    <IconifyIcon icon="solar:user-id-bold-duotone" width={20} height={20} className="me-2" />
                    Age & Content Settings
                  </h5>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Target Age Range</Form.Label>
                        <Form.Select
                          name="age_range"
                          value={settings.age_range}
                          onChange={handleChange}
                          isInvalid={!!errors.age_range}
                        >
                          {ageRanges.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </Form.Select>
                        <Form.Control.Feedback type="invalid">
                          {errors.age_range}
                        </Form.Control.Feedback>
                        <Form.Text className="text-muted">
                          Determines story length and complexity
                        </Form.Text>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Genre Preference</Form.Label>
                        <Form.Select
                          name="genre_preference"
                          value={settings.genre_preference}
                          onChange={handleChange}
                          isInvalid={!!errors.genre_preference}
                        >
                          {genrePreferences.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </Form.Select>
                        <Form.Control.Feedback type="invalid">
                          {errors.genre_preference}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Language Level</Form.Label>
                        <Form.Select
                          name="language_level"
                          value={settings.language_level}
                          onChange={handleChange}
                          isInvalid={!!errors.language_level}
                        >
                          {languageLevels.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </Form.Select>
                        <Form.Control.Feedback type="invalid">
                          {errors.language_level}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Moral Theme</Form.Label>
                        <Form.Select
                          name="moral_theme"
                          value={settings.moral_theme}
                          onChange={handleChange}
                          isInvalid={!!errors.moral_theme}
                        >
                          {moralThemes.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </Form.Select>
                        <Form.Control.Feedback type="invalid">
                          {errors.moral_theme}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {/* Story Structure Section */}
              <Card className="mb-4">
                <Card.Header>
                  <h5 className="mb-0">
                    <IconifyIcon icon="solar:document-text-bold-duotone" width={20} height={20} className="me-2" />
                    Story Structure
                  </h5>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Story Parts (3-8)</Form.Label>
                        <Form.Control
                          type="number"
                          name="story_parts"
                          value={settings.story_parts}
                          onChange={handleChange}
                          min={3}
                          max={8}
                          isInvalid={!!errors.story_parts}
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.story_parts}
                        </Form.Control.Feedback>
                        <Form.Text className="text-muted">
                          Number of sections/parts in the story
                        </Form.Text>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Max Word Count (100-2000)</Form.Label>
                        <Form.Control
                          type="number"
                          name="max_word_count"
                          value={settings.max_word_count}
                          onChange={handleChange}
                          min={100}
                          max={2000}
                          isInvalid={!!errors.max_word_count}
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.max_word_count}
                        </Form.Control.Feedback>
                        <Form.Text className="text-muted">
                          Maximum words per story
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {/* Content Preferences Section */}
              <Card className="mb-4">
                <Card.Header>
                  <h5 className="mb-0">
                    <IconifyIcon icon="solar:star-bold-duotone" width={20} height={20} className="me-2" />
                    Content Preferences
                  </h5>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <Form.Check
                        type="switch"
                        id="include_diversity"
                        name="include_diversity"
                        label="Include Diverse Characters"
                        checked={settings.include_diversity}
                        onChange={handleChange}
                        className="mb-3"
                      />
                      <Form.Text className="text-muted d-block mb-3">
                        Include characters from different backgrounds and abilities
                      </Form.Text>

                      <Form.Check
                        type="switch"
                        id="include_sensory_details"
                        name="include_sensory_details"
                        label="Include Sensory Details"
                        checked={settings.include_sensory_details}
                        onChange={handleChange}
                        className="mb-3"
                      />
                      <Form.Text className="text-muted d-block mb-3">
                        Add vivid descriptions of sights, sounds, and other senses
                      </Form.Text>

                      <Form.Check
                        type="switch"
                        id="include_interactive_questions"
                        name="include_interactive_questions"
                        label="Include Interactive Questions"
                        checked={settings.include_interactive_questions}
                        onChange={handleChange}
                        className="mb-3"
                      />
                      <Form.Text className="text-muted d-block mb-3">
                        Add questions mid-story to pause for user input
                      </Form.Text>
                    </Col>
                    <Col md={6}>
                      <Form.Check
                        type="switch"
                        id="include_sound_effects"
                        name="include_sound_effects"
                        label="Include Sound Effects"
                        checked={settings.include_sound_effects}
                        onChange={handleChange}
                        className="mb-3"
                      />
                      <Form.Text className="text-muted d-block mb-3">
                        Add sound effects like "Whoosh!", "Bang!" for excitement
                      </Form.Text>

                      <Form.Check
                        type="switch"
                        id="explain_complex_words"
                        name="explain_complex_words"
                        label="Explain Complex Words"
                        checked={settings.explain_complex_words}
                        onChange={handleChange}
                        className="mb-3"
                      />
                      <Form.Text className="text-muted d-block mb-3">
                        Explain difficult words in simple terms for younger readers
                      </Form.Text>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              <div className="d-flex justify-content-end gap-2">
                <Button
                  variant="secondary"
                  onClick={() => fetchSettings()}
                  disabled={saving}
                >
                  Reset
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Spinner size="sm" className="me-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <IconifyIcon icon="solar:diskette-bold-duotone" width={18} height={18} className="me-2" />
                      Save Settings
                    </>
                  )}
                </Button>
              </div>
            </Form>
          </ComponentContainerCard>
        </Col>
      </Row>
    </>
  );
};

export default StorySettingsForm;

