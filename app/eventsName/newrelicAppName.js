module.exports = {
    isValidName: function (appName) {
        return !!validName.find(x => x === appName);
    }
};

const validName = [
    'Accounting',
    'AccountingExternal',
    'AccountingPrivateApi',
    'AccountManagementPrivate',
    'AccountManagementPublic',
    'AccPostingsApi',
    'Address.PrivateApi',
    'Agents',
    'AgentsApi',
    'App',
    'Astral',
    'AuditTrail.PrivateApi',
    'AuditTrail.PublicApi',
    'Awp',
    'BackOffice.Private.Api',
    'BankIntegrations',
    'BankIntegrationsPublic',
    'BillingExternalApi',
    'Biz',
    'BizApi',
    'BPM.ApiProxy',
    'BPM.Archives',
    'BPM.CaseDocs',
    'BPM.Distribution',
    'BPM.Emails',
    'BPM.Links',
    'BPM.Preview',
    'BPM.Recognition',
    'BPM.Registry.Documents',
    'BPM.Storage',
    'BPM.Vacations',
    'CashboxExternalApi',
    'CashExternalApi',
    'Catalog',
    'CatalogApi',
    'CommonApi.Api',
    'CommonApi.External',
    'CommonApi.WebApp',
    'Consultations',
    'Consultations.Api',
    'Contracts',
    'ContractsApi',
    'ContractsExternal',
    'Docs.PrivateApi',
    'Docs.RestApi',
    'Docs.WebApp',
    'Documents',
    'Edm.Private',
    'Edm.Web',
    'ErptApi',
    'ErptPublicApi',
    'ExternalBilling',
    'FileStorage',
    'Finances',
    'FinancesApi',
    'FinancesPublic',
    'Header',
    'HeaderPublicApi',
    'HistoricalLogs',
    'HomePrivate',
    'HomePublic',
    'HomeWebApp',
    'Kontragents',
    'KontragentsApi',
    'KontragentsExternal',
    'MailService',
    'Main',
    'MainOutSource',
    'MainOutSource.PrivateApi',
    'MainOutSource.RestApi',
    'Manufacturing',
    'Manufacturing.External',
    'Manufacturing.Private',
    'md-journal',
    'md-promo',
    'md-promo-club',
    'md-promo-mdbuhgalter',
    'md-promo-yii2',
    'md-sberbank',
    'MessengerService',
    'mixinAttributeLinks',
    'mixinAttributes',
    'Mobile',
    'Moedelo.Chat.PrivateApi',
    'Moedelo.Chat.PublicApi',
    'Moedelo.Chat.Signalr',
    'MoedeloApi',
    'My Application',
    'OfficePrivateApi',
    'OfficeRestApi',
    'OfficeWebApp',
    'org.moedelo.account',
    'org.moedelo.id',
    'org.moedelo.internalbilling',
    'org.moedelo.oauth',
    'org.sberbank.eds',
    'OutSystemsIntegrationApi',
    'Partner',
    'PartnerNew',
    'Pay',
    'PaymentImportApi',
    'PaymentOrderImport',
    'Payments.Api',
    'Payroll',
    'Payroll.PrivateApi',
    'PayrollExternal',
    'PdfPrinter',
    'PHP Application',
    'PostingEngine',
    'Postings.PrivateApi',
    'PriceLists.Api',
    'PrimaryDocs',
    'Pro',
    'ProApi',
    'Promo',
    'PromoService',
    'PushService',
    'PushServicePublic',
    'RegistrationOoo',
    'RegistrationService',
    'RegNoteApi',
    'Requisites',
    'RequisitesApi',
    'RequisitesExternal',
    'Rpt',
    'RptApi',
    'RptPublicApi',
    'SeenecoProxy',
    'SherlockCRM.MoeDelo',
    'SherlockCRM.Web',
    'SherlockCRM.WebApi',
    'SignalR',
    'SmsService',
    'Stock',
    'Stock.PrivateApi',
    'StockExternal',
    'SuiteCrmApi',
    'Tags.PrivateApi',
    'Tags.PublicApi',
    'Tariffs.Api',
    'TaxPostingsApi',
    'TaxRemains.PrivateApi',
    'TaxRemains.RestApi',
    'Tester',
    'UploadedFiles.PrivateApi',
    'UploadedFiles.PublicApi'
];