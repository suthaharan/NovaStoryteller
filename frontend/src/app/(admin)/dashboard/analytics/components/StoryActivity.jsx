import { useCallback, useEffect } from 'react';
import ReactApexChart from 'react-apexcharts';
import { Card, CardBody, CardTitle, Col, Row } from 'react-bootstrap';
import { useApiData } from '@/hooks/useApiData';
import LoadingSpinner from '@/components/common/LoadingSpinner';

const StoryActivity = () => {
  // Memoize transform function to prevent infinite loops
  const transformChartData = useCallback((data) => {
    const charts = data?.charts || {};
    
    const result = {};
    
    // Story creation (last 7 days)
    if (charts.story_creation && Array.isArray(charts.story_creation)) {
      result.storyLabels = charts.story_creation.map(item => item.label);
      result.storyData = charts.story_creation.map(item => item.count);
    } else {
      result.storyLabels = [];
      result.storyData = [];
    }
    
    // Session activity (last 7 days)
    if (charts.session_activity && Array.isArray(charts.session_activity)) {
      result.sessionLabels = charts.session_activity.map(item => item.label);
      result.sessionData = charts.session_activity.map(item => item.count);
    } else {
      result.sessionLabels = [];
      result.sessionData = [];
    }
    
    // Stories by template (pie chart)
    if (charts.stories_by_template && Array.isArray(charts.stories_by_template)) {
      result.templateLabels = charts.stories_by_template.map(item => item.label);
      result.templateData = charts.stories_by_template.map(item => item.value);
    } else {
      result.templateLabels = [];
      result.templateData = [];
    }
    
    // Stories by month (bar chart)
    if (charts.stories_by_month && Array.isArray(charts.stories_by_month)) {
      result.monthLabels = charts.stories_by_month.map(item => item.label);
      result.monthData = charts.stories_by_month.map(item => item.count);
    } else {
      result.monthLabels = [];
      result.monthData = [];
    }
    
    return result;
  }, []);

  const { data, loading, error, refetch } = useApiData('/dashboard-stats/', {
    transformData: transformChartData,
    showToast: false, // Don't show toast for chart data
    autoFetch: true,
    dependencies: [], // No additional dependencies
  });

  if (loading) {
    return (
      <Card>
        <CardBody>
          <LoadingSpinner message="Loading chart..." centered={true} />
        </CardBody>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardBody>
          <p className="text-danger mb-0">Error loading charts: {error}</p>
        </CardBody>
      </Card>
    );
  }

  // Always show charts even if data is empty (will show zeros)
  // Only return early if data is completely missing
  if (!data) {
    return (
      <Card>
        <CardBody>
          <p className="text-muted mb-0">Loading chart data...</p>
        </CardBody>
      </Card>
    );
  }
  
  // Ensure all data arrays exist (default to empty arrays)
  const storyData = data.storyData || [];
  const sessionData = data.sessionData || [];
  const templateData = data.templateData || [];
  const monthData = data.monthData || [];
  const storyLabels = data.storyLabels || [];
  const sessionLabels = data.sessionLabels || [];
  const templateLabels = data.templateLabels || [];
  const monthLabels = data.monthLabels || [];

  const storyChartOpts = {
    series: [{
      name: 'Stories Created',
      type: 'bar',
      data: storyData
    }],
    chart: {
      height: 300,
      type: 'bar',
      toolbar: {
        show: false
      }
    },
    plotOptions: {
      bar: {
        columnWidth: '50%',
        borderRadius: 4
      }
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      show: true,
      width: 2,
      colors: ['transparent']
    },
    xaxis: {
      categories: storyLabels
    },
    yaxis: {
      title: {
        text: 'Stories'
      }
    },
    fill: {
      opacity: 1,
      colors: ['#1bb394']
    },
    tooltip: {
      y: {
        formatter: function (val) {
          return val + ' stories';
        }
      }
    }
  };

  const sessionChartOpts = {
    series: [{
      name: 'Listening Sessions',
      type: 'area',
      data: sessionData
    }],
    chart: {
      height: 300,
      type: 'area',
      toolbar: {
        show: false
      }
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: 'smooth',
      width: 2
    },
    xaxis: {
      categories: sessionLabels
    },
    yaxis: {
      title: {
        text: 'Sessions'
      }
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.3,
        stops: [0, 90, 100]
      },
      colors: ['#1e84c4']
    },
    tooltip: {
      y: {
        formatter: function (val) {
          return val + ' sessions';
        }
      }
    }
  };

  // Template pie chart options
  const templateChartOpts = {
    series: templateData,
    chart: {
      height: 300,
      type: 'pie',
      toolbar: {
        show: false
      }
    },
    labels: templateLabels,
    colors: ['#1bb394', '#1e84c4', '#f7b84b', '#f06548', '#5b73e8'],
    legend: {
      position: 'bottom'
    },
    tooltip: {
      y: {
        formatter: function (val) {
          return val + ' stories';
        }
      }
    }
  };

  // Monthly bar chart options
  const monthlyChartOpts = {
    series: [{
      name: 'Stories Created',
      data: monthData
    }],
    chart: {
      height: 300,
      type: 'bar',
      toolbar: {
        show: false
      }
    },
    plotOptions: {
      bar: {
        columnWidth: '60%',
        borderRadius: 4
      }
    },
    dataLabels: {
      enabled: false
    },
    xaxis: {
      categories: monthLabels
    },
    yaxis: {
      title: {
        text: 'Stories'
      }
    },
    fill: {
      opacity: 1,
      colors: ['#1bb394']
    },
    tooltip: {
      y: {
        formatter: function (val) {
          return val + ' stories';
        }
      }
    }
  };

  return (
    <Row>
      {/* Last 7 Days Charts - Always show if labels exist */}
      {storyLabels.length > 0 && (
        <Col lg={6}>
          <Card>
            <CardBody>
              <CardTitle as="h4">Story Creation (Last 7 Days)</CardTitle>
              <div dir="ltr">
                <ReactApexChart
                  height={300}
                  options={storyChartOpts}
                  series={storyChartOpts.series}
                  type="bar"
                />
              </div>
            </CardBody>
          </Card>
        </Col>
      )}
      {sessionLabels.length > 0 && (
        <Col lg={6}>
          <Card>
            <CardBody>
              <CardTitle as="h4">Listening Activity (Last 7 Days)</CardTitle>
              <div dir="ltr">
                <ReactApexChart
                  height={300}
                  options={sessionChartOpts}
                  series={sessionChartOpts.series}
                  type="area"
                />
              </div>
            </CardBody>
          </Card>
        </Col>
      )}
      
      {/* Monthly and Template Charts - Always show if labels exist */}
      {monthLabels.length > 0 && (
        <Col lg={6}>
          <Card>
            <CardBody>
              <CardTitle as="h4">Stories by Month (Last 6 Months)</CardTitle>
              <div dir="ltr">
                <ReactApexChart
                  height={300}
                  options={monthlyChartOpts}
                  series={monthlyChartOpts.series}
                  type="bar"
                />
              </div>
            </CardBody>
          </Card>
        </Col>
      )}
      {templateLabels.length > 0 && (
        <Col lg={6}>
          <Card>
            <CardBody>
              <CardTitle as="h4">Stories by Category</CardTitle>
              <div dir="ltr">
                <ReactApexChart
                  height={300}
                  options={templateChartOpts}
                  series={templateChartOpts.series}
                  type="pie"
                />
              </div>
            </CardBody>
          </Card>
        </Col>
      )}
      
      {/* Show message if no charts have labels (no data structure) */}
      {storyLabels.length === 0 && 
       sessionLabels.length === 0 && 
       monthLabels.length === 0 && 
       templateLabels.length === 0 && (
        <Col xs={12}>
          <Card>
            <CardBody>
              <p className="text-muted mb-0 text-center">No chart data available. Create some stories to see analytics.</p>
            </CardBody>
          </Card>
        </Col>
      )}
    </Row>
  );
};

export default StoryActivity;

