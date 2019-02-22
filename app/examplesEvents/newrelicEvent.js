module.exports = {
    owner: '',
    severity: 'CRITICAL',
    policy_url: 'https://alerts.newrelic.com/accounts/667664/policies/377374',
    closed_violations_count: {
        critical: 0,
        warning: 0
    },
    current_state: 'open',
    policy_name: 'SkypeNotificator',
    incident_url: 'https://alerts.newrelic.com/accounts/667664/incidents/57924876',
    condition_family_id: 10153991,
    incident_acknowledge_url: 'https://alerts.newrelic.com/accounts/667664/incidents/57924876/acknowledge',
    targets: [
        {
            id: '3865052',
            name: 'Rpt',
            link: 'https://rpm.newrelic.com/accounts/667664/applications/3865052?tw[start]=1550856308&tw[end]=1550858108',
            labels: {
                Platform: 'Net'
            },
            product: 'APM',
            type: 'Application'
        }
    ],
    version: '1.0',
    condition_id: 39605400,
    duration: 2016,
    account_id: 667664,
    incident_id: 57924876,
    event_type: 'INCIDENT',
    violation_chart_url: 'http://gorgon.nr-assets.net/image/f7b54de8-33c7-4e6a-ae90-d2edcb709b8a?config.legend.enabled=false',
    account_name: 'org.moedelo',
    open_violations_count: {
        critical: 1,
        warning: 0
    },
    details: 'Error percentage > 2% for at least 5 minutes',
    violation_callback_url: 'https://rpm.newrelic.com/accounts/667664/applications/3865052?tw[start]=1550856308&tw[end]=1550858108',
    condition_name: 'Error percentage (High)',
    timestamp: 1550858106434
};
