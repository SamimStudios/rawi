import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Centralized translations organized by category
const translations = {
  en: {
    // Navigation & Header
    templates: 'Templates',
    tryFree: 'Try Free',
    help: 'Help',
    signIn: 'Sign In',
    signUp: 'Sign Up',
    signOut: 'Sign Out',
    dashboard: 'Dashboard',
    
    // Legal Pages
    terms: 'Terms',
    privacy: 'Privacy',
    consent: 'Consent',
    termsConditions: 'Terms & Conditions',
    privacyPolicy: 'Privacy Policy',
    consentIpPolicy: 'Consent & IP Policy',
    
    // Main Content
    heroHeadline: 'Turn your photos into cinematic moments.',
    heroSubtext: 'Try a teaser for free. Upgrade to generate full trailers.',
    tryFreeButton: 'Try Free',
    getStarted: 'Get Started',
    alreadyHaveAccount: 'Already have an account?',
    
    // App Pages
    welcomeUser: 'Welcome',
    walletBalance: 'Wallet Balance',
    credits: 'Credits',
    quickLinks: 'Quick Links',
    browseTemplates: 'Browse Templates',
    myHistory: 'My History',
    buyCredits: 'Buy Credits',
    recentJobsPlaceholder: 'Your recent jobs will appear here.',
    wallet: 'Wallet',
    viewTransactions: 'View Transactions',
    creditsExpiry: 'Credits expire after 90 days.',
    settings: 'Settings',
    
    // Form Fields
    name: 'Name',
    language: 'Language',
    accountConnections: 'Account Connections',
    save: 'Save',
    
    // History & Jobs
    title: 'Title',
    date: 'Date',
    status: 'Status',
    result: 'Result',
    statusQueued: 'Queued',
    statusRunning: 'Running',
    statusSuccess: 'Success',
    statusFailed: 'Failed',
    viewResult: 'View Result',
    
    // Job Status
    generationStatus: 'Generation Status',
    jobId: 'Job ID',
    templateName: 'Template',
    statusQueuedDesc: 'Queued — waiting for a worker',
    statusRunningDesc: 'Generating — this may take a moment',
    statusSuccessDesc: 'Completed — open result',
    statusFailedDesc: 'Failed — please try again or contact support',
    openResult: 'Open Result',
    tryAgain: 'Try Again',
    guestNote: 'Guest preview only. Sign up to save and download.',
    autoRefreshing: 'Auto-refreshing status…',
    
    // Results
    yourResult: 'Your Result',
    untitled: 'Untitled',
    duration: 'Duration',
    guestRibbon: 'Guest preview — Watermarked. Sign up to save & download.',
    download: 'Download',
    shareLink: 'Share Link',
    regenerate: 'Regenerate',
    makeVariation: 'Make Variation',
    template: 'Template',
    submittedDate: 'Submitted',
    creditsSpent: 'Credits Spent',
    resultNotes: 'If something looks off, re-run or visit Help.',
    relatedOutputs: 'Related Outputs',
    linkCopied: 'Link copied to clipboard!',
    
    // Transactions
    transactionType: 'Type',
    transactionAmount: 'Amount',
    transactionDate: 'Date',
    purchase: 'Purchase',
    generation: 'Generation',
    transactionHistory: 'Transaction History',
    teaser: 'Teaser',
    trailer: 'Trailer',
    poster: 'Poster',
    subscriptionMonthly: 'Subscription (Monthly)',
    
    // Wallet Purchase Flow
    oneTime: 'One-time',
    subscription: 'Subscription',
    monthly: 'Monthly',
    weekly: 'Weekly',
    howManyCredits: 'How many credits do you need?',
    total: 'Total',
    payWithStripe: 'Pay with Stripe',
    startSubscription: 'Start Subscription',
    manageBilling: 'Manage billing',
    promoCode: 'Promo code',
    currentBalance: 'Current Balance',
    creditsExpireIn90: 'Credits expire in 90 days',
    light: 'Light',
    standard: 'Standard',
    pro: 'Pro',
    studio: 'Studio',
    billedEach: 'Billed each',
    securePayment: 'Secure payment via Stripe',
    
    // Error Pages
    pageNotFound: 'Page Not Found',
    pageNotFoundMessage: 'The page you\'re looking for doesn\'t exist or has been moved.',
    serverError: 'Server Error', 
    serverErrorMessage: 'Something went wrong on our end. We\'re working to fix it.',
    goHome: 'Go Home',
    goBack: 'Go Back',
    needHelp: 'Need help?',
    visitHelpCenter: 'Visit Help Center',
    persistentError: 'If this error persists:',
    contactSupport: 'Contact Support',
    
    // Help & Support
    helpPageTitle: 'Help & Support',
    helpPageSubtitle: 'Get help and support for using Rawi App\'s cinematic photo editing tools.',
    faqTitle: 'Frequently Asked Questions',
    
    // Success/Error Messages
    paymentSuccessful: 'Payment successful — credits added.',
    paymentCanceled: 'Payment canceled.',
    subscriptionActive: 'Subscription active.',
    subscriptionCheckoutCanceled: 'Subscription checkout canceled.',
    demoSaved: 'Settings saved successfully!',
    
    // Legal Content
    legalPlaceholder: 'This is a placeholder for legal content. Please consult with legal professionals to create appropriate content for your jurisdiction.',
    consentLogNote: 'Last accepted: Consent & IP v1.0',
    
    // Terms & Conditions
    termsAcceptance: 'Acceptance and Agreement',
    termsAcceptanceContent: 'By accessing or using Rawi App ("the Service"), operated by ﺻﻤﻴﻢ ﺳﺘﻮدﻳﻮز ش.ذ.م.م-ﻣﻨﻘﺔ ﺣﺮة (SAMIM STUDIOS L.L.C-FZ), you agree to be bound by these Terms and Conditions. You must be at least 13 years of age to use this Service. If you are under 18, you must have parental consent. By using the Service, you represent that you have the legal authority to enter into this agreement.',
    termsCredits: 'Credits System and Payments',
    termsCreditsContent: 'All content generation requires credits purchased through our payment system. Credits expire 90 days after purchase and are non-transferable. Payment processing is handled by Stripe. All fees are non-refundable except as outlined in our Refund Policy. SAMIM STUDIOS L.L.C-FZ reserves the right to modify pricing with 30 days notice.',
    termsOwnership: 'Content Ownership and Rights',
    termsOwnershipContent: 'You retain ownership of all content you upload. You must have legal rights to all uploaded materials and warrant that uploads do not infringe third-party rights. You may not upload celebrity likenesses, copyrighted materials, or content depicting minors without explicit consent. Generated outputs are licensed to you for personal and commercial use, subject to these Terms.',
    termsIpConsent: 'Consent to IP Terms and Processing',
    termsIpConsentContent: 'By using our services, you explicitly consent to our intellectual property terms and content processing policies. You acknowledge that you have read, understood, and agree to our Consent & IP Policy. You consent to the processing of your uploaded content for AI generation purposes and agree that generated outputs will be owned by you under the licensing terms specified herein.',
    termsProhibited: 'Prohibited Uses and Conduct',
    termsProhibitedContent: 'You may not use the Service to create illegal, harmful, defamatory, or adult content. Prohibited activities include reverse engineering, attempting to access unauthorized areas, distributing malware, or overloading our systems. SAMIM STUDIOS L.L.C-FZ reserves the right to suspend accounts for violations without notice.',
    termsAvailability: 'Service Availability and Modifications',
    termsAvailabilityContent: 'SAMIM STUDIOS L.L.C-FZ strives for 99% uptime but does not guarantee uninterrupted service. We may modify, suspend, or discontinue features with reasonable notice. Scheduled maintenance will be announced in advance when possible. We are not liable for service interruptions or data loss.',
    termsLiability: 'Limitation of Liability and Disclaimers',
    termsLiabilityContent: 'THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES BY SAMIM STUDIOS L.L.C-FZ. WE DISCLAIM ALL LIABILITY FOR INDIRECT, CONSEQUENTIAL, OR PUNITIVE DAMAGES. OUR LIABILITY IS LIMITED TO THE AMOUNT PAID FOR THE SERVICE IN THE 12 MONTHS PRECEDING THE CLAIM. THIS LIMITATION APPLIES TO THE FULLEST EXTENT PERMITTED BY LAW.',
    termsLaw: 'Governing Law and Dispute Resolution',
    termsLawContent: 'These Terms are governed by UAE Federal Law. Disputes will be resolved through binding arbitration in Abu Dhabi under ADCCAC rules, except for intellectual property claims which may be brought in UAE courts. The prevailing party is entitled to reasonable attorney fees.',
    termsChanges: 'Modifications to Terms',
    termsChangesContent: 'SAMIM STUDIOS L.L.C-FZ may update these Terms periodically. Material changes will be posted with 30 days notice. Continued use after changes constitutes acceptance. If you disagree with modifications, you must discontinue use of the Service.',
    
    // Privacy Policy
    privacyData: 'Information We Collect',
    privacyDataContent: 'We collect account information (name, email, authentication provider), uploaded content (images, text, audio), generated outputs, usage analytics (pages viewed, features used, device information), payment information (processed by Stripe), and communication records with support.',
    privacyUse: 'How We Use Your Information',
    privacyUseContent: 'Your information is used by SAMIM STUDIOS L.L.C-FZ to provide AI generation services, process payments, improve our algorithms and templates, provide customer support, prevent fraud and abuse, comply with legal obligations, and send service-related communications.',
    privacySharing: 'Information Sharing and Disclosure',
    privacySharingContent: 'SAMIM STUDIOS L.L.C-FZ does not sell personal information. We may share data with AI service providers for processing, Stripe for payments, cloud storage providers for data hosting, legal authorities when required by law, and business successors in case of acquisition (with notice).',
    privacyStorage: 'Data Storage and Retention',
    privacyStorageContent: 'Guest content may be deleted after 7 days. User accounts and paid content are retained until account deletion. Backups may persist for up to 90 days after deletion. You may request data deletion at any time by contacting support.',
    privacySecurity: 'Data Security Measures',
    privacySecurityContent: 'SAMIM STUDIOS L.L.C-FZ implements encryption in transit and at rest, secure authentication systems, regular security audits, access controls for staff, and incident response procedures. However, no system is completely secure. Users share responsibility for account security.',
    privacyRights: 'Your Privacy Rights',
    privacyRightsContent: 'You have the right to access, correct, or delete your personal information. You may request data portability or restrict processing. To exercise these rights, contact support@rawiapp.io. We will respond within 30 days.',
     privacyContact: 'Privacy Contact Information',
     privacyContactContent: 'For privacy-related inquiries, complaints, or requests: Email: support@rawiapp.io | Address: SAMIM STUDIOS L.L.C-FZ, Meydan Grandstand, 6th floor, Meydan Road, Nad Al Sheba, Dubai, U.A.E. | Phone: Available upon request through support channels.',
     privacyDeletion: 'User Data Deletion',
     privacyDeletionContent: 'You have the right to request complete deletion of your account and associated data. To request account deletion, contact support@rawiapp.io with your account details. Upon verification, SAMIM STUDIOS L.L.C-FZ will permanently delete your account, uploaded content, generated outputs, and personal information within 30 days. Backup copies may be retained for up to 90 days for recovery purposes, after which they are permanently destroyed. Please note that some data may be retained longer if required by law or for legitimate business purposes such as preventing fraud.',
    
    // Consent & IP Policy
    consentProcess: 'Content Processing Consent',
    consentProcessContent: 'By uploading content, you grant SAMIM STUDIOS L.L.C-FZ and Rawi App a non-exclusive license to process, modify, and generate derivatives using AI technologies. You confirm legal ownership or authorization for all uploaded materials. This consent is revocable by deleting your content.',
    consentUploads: 'Uploaded Content Rights',
    consentUploadsContent: 'You retain full intellectual property rights to uploaded content. You warrant that uploads do not violate third-party rights, including publicity, privacy, or copyright. Celebrity likenesses and copyrighted material require explicit authorization. Violating content will be removed.',
    consentOutputs: 'Generated Content Ownership',
    consentOutputsContent: 'You own the intellectual property rights to AI-generated outputs based on your inputs. These may be used for personal, commercial, or promotional purposes. Outputs cannot be used to train competing AI systems or create derivative generation tools.',
    consentRestrictions: 'Usage Restrictions and Compliance',
    consentRestrictionsContent: 'Generated content must comply with applicable laws and platform policies. Prohibited uses include creating misleading deepfakes, non-consensual intimate imagery, content promoting violence or hatred, or material violating intellectual property rights.',
    consentLiability: 'Content Liability and Enforcement',
    consentLiabilityContent: 'Users are solely responsible for their use of generated content. SAMIM STUDIOS L.L.C-FZ reserves the right to remove content reported for abuse, copyright infringement, or policy violations. Repeat offenders may face account suspension or termination.',

    // Refund Policy
    refund: 'Refunds',
    refundPolicy: 'Refund Policy',
    refundGeneral: 'General Refund Terms',
    refundGeneralContent: 'All purchases are generally final and non-refundable. However, SAMIM STUDIOS L.L.C-FZ provides refunds in specific circumstances as outlined below, in compliance with applicable consumer protection laws.',
    refundEligible: 'Eligible Refund Situations',
    refundEligibleContent: 'Refunds may be granted for: Technical failures preventing content generation after 48 hours, duplicate charges within 7 days, unauthorized payments reported within 30 days, or service unavailability exceeding 24 hours within 7 days of purchase.',
    refundProcess: 'Refund Request Process',
    refundProcessContent: 'To request a refund, contact support@rawiapp.io within 30 days with your transaction ID, detailed issue description, and supporting evidence. Requests are reviewed within 5 business days. Approved refunds are processed within 10 business days.',
    refundExclusions: 'Refund Exclusions',
    refundExclusionsContent: 'No refunds for: Successful content generation (regardless of satisfaction), credits used for any generation, expired credits, subscription fees after the first billing cycle, or purchases made more than 30 days ago.',
    refundSubscriptions: 'Subscription Cancellations',
    refundSubscriptionsContent: 'Subscriptions may be cancelled anytime with effect from the next billing cycle. No partial refunds for unused subscription periods. Cancellation must be requested at least 24 hours before renewal.',
    
    // FAQ
    faq1Question: 'What can I create with Rawi?',
    faq1Answer: 'Cinematic teasers, trailers, fight scenes (more templates coming).',
    faq2Question: 'Do I need to sign up?',
    faq2Answer: 'You can try one teaser free as a guest. To save/share, sign up.',
    faq3Question: 'How do credits work?',
    faq3Answer: 'Every generation costs credits. Buy packs. Credits expire in 90 days.',
    faq4Question: 'Why is my free teaser watermarked?',
    faq4Answer: 'Guest runs are watermarked. Paid runs are always clean.',
    faq5Question: 'My job failed, what now?',
    faq5Answer: 'Contact support to request a credit refund.',
    faq6Question: 'Can I use the generated video commercially?',
    faq6Answer: 'Yes, as long as you own the uploads and respect our Terms.',
    faq7Question: 'What languages are supported?',
    faq7Answer: 'English + Arabic. More coming soon.',
    
    // Common UI Elements
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    cancel: 'Cancel',
    confirm: 'Confirm',
    delete: 'Delete',
    edit: 'Edit',
    view: 'View',
    close: 'Close',
    next: 'Next',
    previous: 'Previous',
    back: 'Back',
    continue: 'Continue',
    apply: 'Apply',
    reset: 'Reset',
    refresh: 'Refresh',
    
    // Form Elements
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    submit: 'Submit',
    required: 'Required',
    optional: 'Optional',
    placeholder: 'Enter text...',
    
    // Pages Content
    templatesSubtitle: 'Discover our collection of cinematic templates to transform your photos.',
    exploreTemplates: 'Explore cinematic templates for your projects',
    viewPastGenerations: 'View your past generations and projects',
    purchaseCredits: 'Purchase credits to generate content',
    recentJobs: 'Recent Jobs',
    
    // Auth Pages
    createAccount: 'Create an account',
    emailPlaceholder: 'Enter your email',
    passwordPlaceholder: 'Enter your password',
    confirmPasswordPlaceholder: 'Confirm your password',
    signUpAccount: 'Sign up for your account',
    alreadyHaveAccountPrefix: 'Already have an account?',
    dontHaveAccount: "Don't have an account?",
    
    // Guest Registration
    saveYourResult: 'Save Your Result',
    registerToSave: 'Sign up to save and share your creation',
    enterEmail: 'Enter your email',
    enterPassword: 'Enter your password',
    confirmYourPassword: 'Confirm your password',
    
    // Common Messages
    cookieMessage: 'We use cookies to improve Rawi. By using the site you agree to our Privacy Policy.',
    acceptCookies: 'Accept',
    declineCookies: 'Decline',
    learnMore: 'Learn More',
    dismiss: 'Dismiss',
    
    // Error Messages
    invalidEmail: 'Invalid email format',
    passwordsDoNotMatch: 'Passwords do not match',
    accountCreatedSuccess: 'Account created successfully! Your job has been saved to your account.',
    createAccountFailed: 'Failed to create account. Please try again.',
    creatingAccount: 'Creating Account...',
    createAccountAndSave: 'Create Account & Save Job',
    byCreatingAccount: 'By creating an account, you agree to our Terms & Privacy Policy',
    
    // Guest Registration Full
    saveYourResultCreate: 'Save Your Result - Create Account',
    
    // Storyboard Page
    storyboardPlayground: 'Storyboard Playground',
    createPersonalizedStoryboard: 'Create your personalized storyboard by filling out the details below',
    storyboardTemplate: 'Template',
    loadingTemplates: 'Loading templates...',
    selectTemplate: 'Select a template',
    leadCharacter: 'Lead Character',
    leadName: 'Name',
    enterLeadCharacterName: 'Enter the lead character\'s name',
    gender: 'Gender',
    selectGender: 'Select gender',
    male: 'Male',
    female: 'Female',
    aiGeneratedCharacter: 'AI Generated Character',
    faceReferenceImage: 'Face Reference Image',
    uploadFaceReference: 'Upload a face reference image',
    chooseImage: 'Choose Image',
    supportingCharacters: 'Supporting Characters',
    supportingCharactersDesc: 'Supporting characters will be automatically generated based on your plot and template.',
    supportingCharacter: 'Supporting Character',
    figureFromPlot: 'Figure from plot',
    aiGeneratedFace: 'AI Generated Face',
    addSupportingCharacter: 'Add Supporting Character',
    genres: 'Genres',
    selectGenresDesc: 'Select up to 3 genres that match your story',
    voiceAndLanguage: 'Voice & Language',
    accent: 'Accent',
    storyPrompt: 'Story Prompt',
    describeStoryScene: 'Describe your story or scene in detail',
    createStoryboard: 'Create Storyboard',
    creating: 'Creating...',
    
    // Error Messages - Storyboard
    fileTooLarge: 'File too large',
    imageUnder5MB: 'Please select an image under 5MB',
    missingFields: 'Missing fields',
    fillAllRequired: 'Please fill in all required fields including template selection',
    missingGenres: 'Missing genres',
    selectAtLeastOneGenre: 'Please select at least one genre',
    insufficientCredits: 'Insufficient Credits',
    needCreditsMessage: 'You need {credits} credits to start this job. Please purchase more credits.',
    storyboardJobCreated: 'Storyboard job created!',
    processingRedirecting: 'Your storyboard is being processed. Redirecting to status page...',
    unexpectedError: 'An unexpected error occurred. Please try again.',
    
    // Common Status Messages
    warning: 'Warning',
    couldNotLoadTemplates: 'Could not load templates. You can still proceed without selecting a template.',
    
    // Additional storyboard translations
    consentRequired: 'Consent Required',
    consentRequiredDescription: 'You must agree to our terms and IP policy to create a storyboard',
    
    // Additional Storyboard Elements
    maxOneSupportingChar: '(Max 1)',
    supportingCharCount: '({count}/1)',
    voiceLanguage: 'Language',
    selectLanguage: 'Select language',
    selectAccent: 'Select accent',
    genresMax3: 'Genres * (Max 3)',
    selectedGenres: 'Selected: {genres} ({count}/3)',
    plotInstructions: 'Plot & Instructions (Optional)',
    plotPlaceholder: 'Describe your story plot or provide specific instructions. Example: \'A thriller about a detective in Paris\' or \'Title: The Last Stand - A sci-fi adventure...\'',
    creatingStoryboard: 'Creating Storyboard...',
    
    // Size Options
    sizeOption: 'Output Size *',
    sizePortrait: 'Portrait (Mobile)',
    sizeLandscape: 'Landscape (Widescreen)',
    selectSize: 'Select output size',
    
    // Storyboard Workspace
    'Failed to load storyboard job': 'Failed to load storyboard job',
    'An unexpected error occurred': 'An unexpected error occurred',
    'Storyboard not found': 'Storyboard not found',
    'Back to Dashboard': 'Back to Dashboard',
    'Storyboard Workspace': 'Storyboard Workspace',
    'Job ID': 'Job ID',
    'Status': 'Status',
    'Job Information': 'Job Information',
    'Not specified': 'Not specified',
    'Movie Information': 'Movie Information',
    'Generate': 'Generate',
    'Movie Title': 'Movie Title',
    'Enter movie title': 'Enter movie title',
    'Movie Plot (Logline)': 'Movie Plot (Logline)',
    'Enter movie plot/logline': 'Enter movie plot/logline',
    'World': 'World',
    'Enter world setting': 'Enter world setting',
    'Look': 'Look',
    'Enter visual style/look': 'Enter visual style/look',
    'Character Development': 'Character Development',
    'Character development section - coming soon': 'Character development section - coming soon',
    'Scene Planning': 'Scene Planning',
    'Scene planning section - coming soon': 'Scene planning section - coming soon',
    'Movie information saved': 'Movie information saved',
    'Generate function will be implemented': 'Generate function will be implemented',
    'Generate Storyboard': 'Generate Storyboard',
    'Regenerate': 'Regenerate',
    'Complete first generation to view/edit details': 'Complete first generation to view/edit details',
    'Save': 'Save',
    'Cancel': 'Cancel',
    'Lead Character': 'Lead Character',
    'Language': 'Language',
    'Accent': 'Accent',
    'Genres': 'Genres',
    'Job information saved': 'Job information saved',
    'Failed to save job information': 'Failed to save job information',
    'Enter lead character name': 'Enter lead character name',
    'Enter gender': 'Enter gender',
    'Enter language': 'Enter language',
    'Enter accent': 'Enter accent',
    'Enter size': 'Enter size',
    'Enter prompt': 'Enter prompt',
    'Enter genres separated by commas': 'Enter genres separated by commas',
    'Prompt': 'Prompt',
    'Size': 'Size',
    'AI Generated Character': 'AI Generated Character',
    'Face Reference': 'Face Reference',
    'Face image uploaded': 'Face image uploaded',
    'No face image uploaded': 'No face image uploaded',
    'Supporting Characters': 'Supporting Characters',
    'Character name': 'Character name',
    'AI Generated Face': 'AI Generated Face',
    'Unnamed': 'Unnamed',
    'Unspecified gender': 'Unspecified gender',
    'Custom face image': 'Custom face image',
    'No face image': 'No face image',
    'Yes': 'Yes',
    'No': 'No',
    'No storyboards found': 'No storyboards found',
    'Create Your First Storyboard': 'Create Your First Storyboard',
    'View Progress': 'View Progress',
    
    // Language and Accent Options
    englishLang: 'English',
    arabicLang: 'Arabic',
    accentUS: 'US',
    accentUK: 'UK',
    accentEgyptian: 'Egyptian',
    accentMSA: 'MSA',
    accentGulf: 'Gulf',
    accentLevantine: 'Levantine',
    
    // Genre Options
    genreAction: 'Action',
    genreAdventure: 'Adventure',
    genreComedy: 'Comedy',
    genreDrama: 'Drama',
    genreFantasy: 'Fantasy',
    genreHorror: 'Horror',
    genreMystery: 'Mystery',
    genreRomance: 'Romance',
    genreSciFi: 'Sci-Fi',
    genreThriller: 'Thriller',
    genreDocumentary: 'Documentary',
    genreAnimation: 'Animation',
    
    // Wallet (English)
    walletTitle: 'Wallet',
    walletDescription: 'Manage your credits and subscriptions',
    walletCurrentBalance: 'Current Balance',
    walletCredits: 'Credits',
    walletCreditsNeverExpire: 'Credits never expire',
    walletOneTimeCreditPacks: 'One-Time Credit Packs',
    walletSubscriptionsWeekly: 'Subscriptions (Weekly)',
    walletDiscountRules: 'Discount Rules',
    walletDiscount0to49: '0–49 cr → 0% off',
    walletDiscount50to99: '50–99 cr → 10% off',
    walletDiscount100to249: '100–249 cr → 20% off',
    walletDiscount250plus: '250+ cr → 30% off',
    walletOff: 'off',
    walletProcessing: 'Processing',
    walletBuyNow: 'Buy Now',
    walletCustomAmount: 'Custom Amount',
    walletCustomAmountDescription: 'Choose exactly how many credits you need (minimum 10)',
    walletOrEnterExactAmount: 'Or enter exact amount',
    walletEnterCredits: 'Enter credits',
    walletOrderSummary: 'Order Summary',
    walletRate: 'Rate',
    walletPurchaseCredits: 'Purchase Credits',
    walletSubscriptionBenefit: 'Always ~10% cheaper than one-time packs!',
    walletWeeklyAutoRenewal: 'Weekly auto-renewal with higher discounts (up to 40%)',
    walletSameEntryPoint: 'Same 20cr entry point for accessibility',
    walletCancelAnytime: 'Cancel anytime through customer portal',
    walletManageSubscriptions: 'Manage Subscriptions',
    walletCheaperThanOneTime: 'cheaper than one-time',
    walletWeek: 'week',
    walletPerCredit: 'Per credit',
    walletVsOneTime: 'vs one-time',
    walletSubscribeNow: 'Subscribe Now',
    walletTransactionHistory: 'Transaction History',
    walletTransactionHistoryDescription: 'View your recent credit purchases and subscriptions',
    
    // Storyboard Workspace
    initialInput: 'Initial Input',
    generateMovieInfo: 'Generate Movie Info',
    lastUpdated: 'Last Updated',
    notAvailable: 'Not Available',
    movieInformation: 'Movie Information',
    priceLabel: 'Price',
    movieTitle: 'Movie Title',
    movieLogline: 'Movie Logline',
    movieWorld: 'Movie World',
    movieLook: 'Movie Look',
    enterMovieTitle: 'Enter movie title',
    enterMovieLogline: 'Enter movie logline',
    enterMovieWorld: 'Enter movie world',
    enterMovieLook: 'Enter movie look',
    regenerateStoryboard: 'Regenerate Storyboard',
    
    // Simple field labels
    logline: 'Logline',
    world: 'World',
    look: 'Look',
  },
  ar: {
    // Navigation & Header (Arabic)
    templates: 'القوالب',
    tryFree: 'جرب مجاناً',
    help: 'مساعدة',
    signIn: 'تسجيل الدخول',
    signUp: 'إنشاء حساب',
    signOut: 'تسجيل الخروج',
    dashboard: 'لوحة التحكم',
    
    // Legal Pages (Arabic)
    terms: 'الشروط',
    privacy: 'الخصوصية',
    consent: 'الموافقة',
    termsConditions: 'الشروط والأحكام',
    privacyPolicy: 'سياسة الخصوصية',
    consentIpPolicy: 'سياسة الموافقة والملكية الفكرية',
    
    // Main Content (Arabic)
    heroHeadline: 'حوّل صورك إلى لقطات سينمائية.',
    heroSubtext: 'جرّب إعلانًا قصيرًا مجانًا. طوّر لحفظ وتنزيل العروض الكاملة.',
    tryFreeButton: 'جرب مجاناً',
    getStarted: 'ابدأ الآن',
    alreadyHaveAccount: 'لديك حساب بالفعل؟',
    
    // App Pages (Arabic)
    welcomeUser: 'مرحباً',
    walletBalance: 'رصيد المحفظة',
    credits: 'رصيد',
    quickLinks: 'روابط سريعة',
    browseTemplates: 'تصفح القوالب',
    myHistory: 'تاريخي',
    buyCredits: 'شراء رصيد',
    recentJobsPlaceholder: 'ستظهر وظائفك الأخيرة هنا.',
    wallet: 'المحفظة',
    viewTransactions: 'عرض المعاملات',
    creditsExpiry: 'ينتهي الرصيد بعد ٩٠ يوماً.',
    settings: 'الإعدادات',
    
    // Form Fields (Arabic)
    name: 'الاسم',
    language: 'اللغة',
    accountConnections: 'ربط الحسابات',
    save: 'حفظ',
    
    // History & Jobs (Arabic)
    title: 'العنوان',
    date: 'التاريخ',
    status: 'الحالة',
    result: 'النتيجة',
    statusQueued: 'في الانتظار',
    statusRunning: 'قيد التشغيل',
    statusSuccess: 'مكتمل',
    statusFailed: 'فشل',
    viewResult: 'عرض النتيجة',
    
    // Job Status (Arabic)
    generationStatus: 'حالة الإنشاء',
    jobId: 'رقم المهمة',
    templateName: 'القالب',
    statusQueuedDesc: 'بالانتظار — بانتظار المعالجة',
    statusRunningDesc: 'جاري الإنشاء — قد يستغرق لحظات',
    statusSuccessDesc: 'اكتمل — افتح النتيجة',
    statusFailedDesc: 'فشل — حاول مرة أخرى أو تواصل مع الدعم',
    openResult: 'افتح النتيجة',
    tryAgain: 'حاول مرة أخرى',
    guestNote: 'عرض للضيف فقط. سجّل لحفظ وتحميل النتيجة.',
    autoRefreshing: 'تحديث تلقائي للحالة…',
    
    // Results (Arabic)
    yourResult: 'نتيجتك',
    untitled: 'بدون عنوان',
    duration: 'المدة',
    guestRibbon: 'معاينة للضيف — مع علامة مائية. سجّل لحفظ وتحميل.',
    download: 'تحميل',
    shareLink: 'شارك الرابط',
    regenerate: 'أعد الإنشاء',
    makeVariation: 'اصنع نسخة',
    template: 'القالب',
    submittedDate: 'تاريخ الإرسال',
    creditsSpent: 'الرصيد المستهلك',
    resultNotes: 'إذا كان هناك خطأ، أعد التشغيل أو زر صفحة المساعدة.',
    relatedOutputs: 'مخرجات ذات صلة',
    linkCopied: 'تم نسخ الرابط!',
    
    // Transactions (Arabic)
    transactionType: 'النوع',
    transactionAmount: 'المبلغ',
    transactionDate: 'التاريخ',
    purchase: 'شراء',
    generation: 'إنتاج',
    transactionHistory: 'تاريخ المعاملات',
    teaser: 'إعلان قصير',
    trailer: 'عرض مقطورة',
    poster: 'بوستر',
    subscriptionMonthly: 'اشتراك (شهري)',
    
    // Wallet Purchase Flow (Arabic)
    oneTime: 'دفع لمرة واحدة',
    subscription: 'اشتراك',
    monthly: 'شهري',
    weekly: 'أسبوعي',
    howManyCredits: 'كم رصيدًا تحتاج؟',
    total: 'الإجمالي',
    payWithStripe: 'ادفع عبر سترايب',
    startSubscription: 'ابدأ الاشتراك',
    manageBilling: 'إدارة الفواتير',
    promoCode: 'رمز ترويجي',
    currentBalance: 'الرصيد الحالي',
    creditsExpireIn90: 'الرصيد ينتهي خلال ٩٠ يومًا',
    light: 'خفيف',
    standard: 'قياسي',
    pro: 'احترافي',
    studio: 'استوديو',
    billedEach: 'يُحاسب كل',
    securePayment: 'دفع آمن عبر سترايب',
    
    // Error Pages (Arabic)
    pageNotFound: 'الصفحة غير موجودة',
    pageNotFoundMessage: 'الصفحة التي تبحث عنها غير موجودة أو تم نقلها.',
    serverError: 'خطأ في الخادم',
    serverErrorMessage: 'حدث خطأ من جانبنا. نعمل على إصلاحه.',
    goHome: 'العودة للرئيسية',
    goBack: 'العودة',
    needHelp: 'تحتاج مساعدة؟',
    visitHelpCenter: 'زر مركز المساعدة',
    persistentError: 'إذا استمر هذا الخطأ:',
    contactSupport: 'تواصل مع الدعم',
    
    // Help & Support (Arabic)
    helpPageTitle: 'المساعدة والدعم',
    helpPageSubtitle: 'احصل على المساعدة والدعم لاستخدام أدوات تحرير الصور السينمائية في تطبيق راوي.',
    faqTitle: 'الأسئلة الشائعة',
    
    // Success/Error Messages (Arabic)
    paymentSuccessful: 'تم الدفع بنجاح — تم إضافة الرصيد.',
    paymentCanceled: 'تم إلغاء الدفع.',
    subscriptionActive: 'الاشتراك نشط.',
    subscriptionCheckoutCanceled: 'تم إلغاء عملية الاشتراك.',
    demoSaved: 'تم حفظ الإعدادات بنجاح!',
    
    // Legal Content (Arabic)
    legalPlaceholder: 'هذا نص تجريبي للمحتوى القانوني. يرجى استشارة المتخصصين القانونيين لإنشاء محتوى مناسب لولايتك القضائية.',
    consentLogNote: 'آخر قبول: سياسة الموافقة والملكية الفكرية الإصدار ١.٠',
    
    // Terms & Conditions (Arabic)
    termsAcceptance: 'القبول والاتفاق',
    termsAcceptanceContent: 'باستخدام تطبيق راوي ("الخدمة")، المُشغل من قِبل ﺻﻤﻴﻢ ﺳﺘﻮدﻳﻮز ش.ذ.م.م-ﻣﻨﻄﻘﺔ ﺣﺮة (SAMIM STUDIOS L.L.C-FZ)، فإنك توافق على الالتزام بهذه الشروط والأحكام. يجب أن يكون عمرك ١٣ عامًا على الأقل لاستخدام هذه الخدمة. إذا كان عمرك أقل من ١٨ عامًا، يجب الحصول على موافقة الوالدين. باستخدام الخدمة، تؤكد أن لديك السلطة القانونية لإبرام هذه الاتفاقية.',
    termsCredits: 'نظام الرصيد والمدفوعات',
    termsCreditsContent: 'جميع عمليات إنشاء المحتوى تتطلب رصيدًا يتم شراؤه عبر نظام الدفع لدينا. ينتهي الرصيد بعد ٩٠ يومًا من الشراء وغير قابل للتحويل. تتم معالجة المدفوعات عبر سترايب. جميع الرسوم غير قابلة للاسترداد باستثناء ما هو مذكور في سياسة الاسترداد. تحتفظ ﺻﻤﻴﻢ ﺳﺘﻮدﻳﻮز ش.ذ.م.م-ﻣﻨﻄﻘﺔ ﺣﺮة بالحق في تعديل الأسعار مع إشعار مدته ٣٠ يومًا.',
    termsOwnership: 'ملكية المحتوى والحقوق',
    termsOwnershipContent: 'تحتفظ بملكية جميع المحتويات التي ترفعها. يجب أن تملك الحقوق القانونية لجميع المواد المرفوعة وتضمن عدم انتهاك حقوق الأطراف الثالثة. لا يجوز رفع صور المشاهير أو المواد المحمية بحقوق الطبع أو محتوى يصور القاصرين دون موافقة صريحة. المخرجات المُولدة مرخصة لك للاستخدام الشخصي والتجاري وفقًا لهذه الشروط.',
    termsIpConsent: 'الموافقة على شروط الملكية الفكرية والمعالجة',
    termsIpConsentContent: 'باستخدام خدماتنا، توافق صراحة على شروط الملكية الفكرية وسياسات معالجة المحتوى الخاصة بنا. تقر بأنك قرأت وفهمت ووافقت على سياسة الموافقة والملكية الفكرية. توافق على معالجة المحتوى المرفوع لأغراض توليد الذكاء الاصطناعي وتوافق على أن المخرجات المُولدة ستكون مملوكة لك وفق شروط الترخيص المحددة هنا.',
    termsProhibited: 'الاستخدامات والسلوكيات المحظورة',
    termsProhibitedContent: 'لا يجوز استخدام الخدمة لإنشاء محتوى غير قانوني أو ضار أو تشهيري أو للبالغين. تشمل الأنشطة المحظورة الهندسة العكسية ومحاولة الوصول لمناطق غير مصرح بها وتوزيع البرمجيات الخبيثة أو إرهاق أنظمتنا. تحتفظ ﺻﻤﻴﻢ ﺳﺘﻮدﻳﻮز ش.ذ.م.م-ﻣﻨﻄﻘﺔ ﺣﺮة بالحق في تعليق الحسابات للمخالفات دون إشعار.',
    termsAvailability: 'توفر الخدمة والتعديلات',
    termsAvailabilityContent: 'تسعى ﺻﻤﻴﻢ ﺳﺘﻮدﻳﻮز ش.ذ.م.م-ﻣﻨﻄﻘﺔ ﺣﺮة لتحقيق ٩٩٪ وقت تشغيل لكن لا تضمن خدمة متواصلة. قد نعدل أو نوقف أو نتوقف عن الميزات مع إشعار معقول. سيتم الإعلان عن الصيانة المجدولة مسبقًا عند الإمكان. لسنا مسؤولين عن انقطاع الخدمة أو فقدان البيانات.',
    termsLiability: 'حدود المسؤولية وإخلاء المسؤولية',
    termsLiabilityContent: 'تُقدم الخدمة "كما هي" دون ضمانات من قِبل ﺻﻤﻴﻢ ﺳﺘﻮدﻳﻮز ش.ذ.م.م-ﻣﻨﻄﻘﺔ ﺣﺮة. نتبرأ من جميع المسؤوليات عن الأضرار غير المباشرة أو التبعية أو العقابية. مسؤوليتنا محدودة بالمبلغ المدفوع للخدمة في ال١٢ شهرًا السابقة للمطالبة. يطبق هذا التحديد بأقصى مدى يسمح به القانون.',
    termsLaw: 'القانون الحاكم وحل النزاعات',
    termsLawContent: 'تخضع هذه الشروط للقانون الاتحادي الإماراتي. ستُحل النزاعات عبر التحكيم الملزم في أبوظبي وفق قواعد مركز أبوظبي للتوفيق والتحكيم التجاري، باستثناء مطالبات الملكية الفكرية التي يمكن رفعها في محاكم الإمارات. الطرف الرابح يستحق أتعاب محاماة معقولة.',
    termsChanges: 'تعديلات الشروط',
    termsChangesContent: 'قد تحدث ﺻﻤﻴﻢ ﺳﺘﻮدﻳﻮز ش.ذ.م.م-ﻣﻨﻄﻘﺔ ﺣﺮة هذه الشروط دوريًا. سيتم نشر التغييرات الجوهرية مع إشعار ٣٠ يومًا. الاستمرار في الاستخدام بعد التغييرات يشكل قبولاً. إذا كنت لا توافق على التعديلات، يجب التوقف عن استخدام الخدمة.',
    
    // Privacy Policy (Arabic)  
    privacyData: 'المعلومات التي نجمعها',
     privacyDataContent: 'نجمع معلومات الحساب (الاسم، البريد الإلكتروني، مزود المصادقة)، المحتوى المرفوع (الصور، النصوص، الأصوات)، المخرجات المُولدة، تحليلات الاستخدام (الصفحات المُشاهدة، الميزات المستخدمة، معلومات الجهاز)، معلومات الدفع (تُعالج بواسطة سترايب)، وسجلات التواصل مع الدعم.',
    privacyUse: 'كيفية استخدام معلوماتك',
    privacyUseContent: 'تستخدم ﺻﻤﻴﻢ ﺳﺘﻮدﻳﻮز ش.ذ.م.م-ﻣﻨﻄﻘﺔ ﺣﺮة معلوماتك لتوفير خدمات إنشاء الذكاء الاصطناعي، معالجة المدفوعات، تحسين الخوارزميات والقوالب، تقديم دعم العملاء، منع الاحتيال والإساءة، الامتثال للالتزامات القانونية، وإرسال إشعارات متعلقة بالخدمة.',
    privacySharing: 'مشاركة المعلومات والإفصاح عنها',
    privacySharingContent: 'لا تبيع ﺻﻤﻴﻢ ﺳﺘﻮدﻳﻮز ش.ذ.م.م-ﻣﻨﻄﻘﺔ ﺣﺮة المعلومات الشخصية. قد نشارك البيانات مع مزودي خدمات الذكاء الاصطناعي للمعالجة، سترايب للمدفوعات، مزودي التخزين السحابي لاستضافة البيانات، السلطات القانونية عند المطلوب قانونيًا، وخلفاء الأعمال في حالة الاستحواذ (مع الإشعار).',
    privacyStorage: 'تخزين البيانات والاحتفاظ بها',
    privacyStorageContent: 'قد يُحذف محتوى الضيوف بعد ٧ أيام. تُحتفظ بحسابات المستخدمين والمحتوى المدفوع حتى حذف الحساب. قد تستمر النسخ الاحتياطية لمدة ٩٠ يومًا بعد الحذف. يمكنك طلب حذف البيانات في أي وقت بالتواصل مع الدعم.',
    privacySecurity: 'إجراءات أمن البيانات',
    privacySecurityContent: 'تطبق ﺻﻤﻴﻢ ﺳﺘﻮدﻳﻮز ش.ذ.م.م-ﻣﻨﻄﻘﺔ ﺣﺮة التشفير أثناء النقل والتخزين، أنظمة مصادقة آمنة، تدقيق أمني منتظم، ضوابط وصول للموظفين، وإجراءات الاستجابة للحوادث. ومع ذلك، لا يوجد نظام آمن بنسبة ١٠٠٪. يتشارك المستخدمون مسؤولية أمان الحساب.',
    privacyRights: 'حقوق الخصوصية الخاصة بك',
    privacyRightsContent: 'لديك الحق في الوصول إلى معلوماتك الشخصية أو تصحيحها أو حذفها. يمكنك طلب نقل البيانات أو تقييد المعالجة. لممارسة هذه الحقوق، تواصل مع support@rawiapp.io. سنرد خلال ٣٠ يومًا.',
     privacyContact: 'معلومات التواصل للخصوصية',
     privacyContactContent: 'للاستفسارات أو الشكاوى أو الطلبات المتعلقة بالخصوصية: البريد الإلكتروني: support@rawiapp.io | العنوان: ﺻﻤﻴﻢ ﺳﺘﻮدﻳﻮز ش.ذ.م.م-ﻣﻨﻄﻘﺔ ﺣﺮة، ﻣﻴﺪان ﺟﺮاﻧﺪ ﺳﺘﺎﻧﺪ، اﻟﻄﺎﺑﻖ اﻟﺴﺎدس، ﺷﺎرع اﻟﻤﻴﺪان، ﻧﺪ اﻟﺸﺒﺎ، دﺑﻲ، اﻹﻣﺎرات اﻟﻌﺮﺑﻴﺔ اﻟﻤﺘﺤﺪة | الهاتف: متاح عند الطلب عبر قنوات الدعم.',
     privacyDeletion: 'حذف بيانات المستخدم',
     privacyDeletionContent: 'لديك الحق في طلب الحذف الكامل لحسابك والبيانات المرتبطة به. لطلب حذف الحساب، تواصل مع support@rawiapp.io مع تفاصيل حسابك. بعد التحقق، ستقوم ﺻﻤﻴﻢ ﺳﺘﻮدﻳﻮز ش.ذ.م.م-ﻣﻨﻄﻘﺔ ﺣﺮة بحذف حسابك ومحتواك المرفوع والنتائج المُنتجة والمعلومات الشخصية نهائياً خلال ٣٠ يوماً. قد تُحتفظ بنسخ احتياطية لمدة تصل إلى ٩٠ يوماً لأغراض الاستعادة، وبعدها يتم تدميرها نهائياً. يُرجى ملاحظة أن بعض البيانات قد تُحتفظ بها لفترة أطول إذا كان ذلك مطلوباً بموجب القانون أو لأغراض تجارية مشروعة مثل منع الاحتيال.',
    
    // Consent & IP Policy (Arabic)
    consentProcess: 'موافقة معالجة المحتوى',
    consentProcessContent: 'برفع المحتوى، تمنح ﺻﻤﻴﻢ ﺳﺘﻮدﻳﻮز ش.ذ.م.م-ﻣﻨﻄﻘﺔ ﺣﺮة وتطبيق راوي ترخيصًا غير حصري لمعالجة وتعديل وإنشاء مشتقات باستخدام تقنيات الذكاء الاصطناعي. تؤكد الملكية القانونية أو التخويل لجميع المواد المرفوعة. هذه الموافقة قابلة للإلغاء بحذف المحتوى.',
    consentUploads: 'حقوق المحتوى المرفوع',
    consentUploadsContent: 'تحتفظ بحقوق الملكية الفكرية الكاملة للمحتوى المرفوع. تضمن عدم انتهاك المواد المرفوعة لحقوق الأطراف الثالثة، بما في ذلك حقوق الدعاية والخصوصية وحقوق الطبع والنشر. تتطلب صور المشاهير والمواد المحمية بحقوق الطبع تخويلاً صريحًا. سيُزال المحتوى المخالف.',
    consentOutputs: 'ملكية المحتوى المُولد',
    consentOutputsContent: 'تملك حقوق الملكية الفكرية للمخرجات المُولدة بالذكاء الاصطناعي المبنية على مدخلاتك. يمكن استخدامها لأغراض شخصية أو تجارية أو ترويجية. لا يمكن استخدام المخرجات لتدريب أنظمة ذكاء اصطناعي منافسة أو إنشاء أدوات توليد مشتقة.',
    consentRestrictions: 'قيود الاستخدام والامتثال',
    consentRestrictionsContent: 'يجب أن يمتثل المحتوى المُولد للقوانين المعمول بها وسياسات المنصة. تشمل الاستخدامات المحظورة إنشاء تزييف عميق مضلل، صور حميمية غير توافقية، محتوى يروج للعنف أو الكراهية، أو مواد تنتهك حقوق الملكية الفكرية.',
    consentLiability: 'مسؤولية المحتوى والإنفاذ',
    consentLiabilityContent: 'المستخدمون مسؤولون وحدهم عن استخدامهم للمحتوى المُولد. تحتفظ ﺻﻤﻴﻢ ﺳﺘﻮدﻳﻮز ش.ذ.م.م-ﻣﻨﻄﻘﺔ ﺣﺮة بالحق في إزالة المحتوى المُبلغ عنه للإساءة أو انتهاك حقوق الطبع أو مخالفة السياسات. قد يواجه المخالفون المتكررون تعليق الحساب أو الإنهاء.',

    // Refund Policy (Arabic)
    refund: 'الاستردادات',
    refundPolicy: 'سياسة الاسترداد',
    refundGeneral: 'شروط الاسترداد العامة',
    refundGeneralContent: 'جميع المشتريات نهائية وغير قابلة للاسترداد بشكل عام. ومع ذلك، توفر ﺻﻤﻴﻢ ﺳﺘﻮدﻳﻮز ش.ذ.م.م-ﻣﻨﻄﻘﺔ ﺣﺮة استردادات في ظروف محددة كما هو مبين أدناه، امتثالاً لقوانين حماية المستهلك المعمول بها.',
    refundEligible: 'حالات الاسترداد المؤهلة',
    refundEligibleContent: 'قد تُمنح الاستردادات في: الإخفاقات التقنية التي تمنع إنشاء المحتوى بعد ٤٨ ساعة، الرسوم المكررة خلال ٧ أيام، المدفوعات غير المصرح بها المُبلغ عنها خلال ٣٠ يومًا، أو عدم توفر الخدمة لأكثر من ٢٤ ساعة خلال ٧ أيام من الشراء.',
    refundProcess: 'عملية طلب الاسترداد',
    refundProcessContent: 'لطلب استرداد، تواصل مع support@rawiapp.io خلال ٣٠ يومًا مع رقم المعاملة ووصف تفصيلي للمشكلة والأدلة الداعمة. تُراجع الطلبات خلال ٥ أيام عمل. تُعالج الاستردادات المعتمدة خلال ١٠ أيام عمل.',
    refundExclusions: 'استثناءات الاسترداد',
    refundExclusionsContent: 'لا استرداد في: إنشاء المحتوى الناجح (بغض النظر عن الرضا)، الرصيد المستخدم لأي إنشاء، الرصيد المنتهي الصلاحية، رسوم الاشتراك بعد دورة الفوترة الأولى، أو المشتريات التي تمت منذ أكثر من ٣٠ يومًا.',
    refundSubscriptions: 'إلغاء الاشتراكات',
    refundSubscriptionsContent: 'يمكن إلغاء الاشتراكات في أي وقت مع السريان من دورة الفوترة التالية. لا استردادات جزئية لفترات الاشتراك غير المستخدمة. يجب طلب الإلغاء قبل ٢٤ ساعة على الأقل من التجديد.',
    
    // FAQ (Arabic)
    faq1Question: 'ماذا يمكنني أن أنشئ باستخدام راوي؟',
    faq1Answer: 'إعلانات قصيرة، عروض سينمائية، مشاهد قتال (المزيد قريبًا).',
    faq2Question: 'هل يجب أن أسجّل؟',
    faq2Answer: 'يمكنك تجربة إعلان قصير واحد مجانًا كضيف. للحفظ والمشاركة، يجب التسجيل.',
    faq3Question: 'كيف يعمل الرصيد؟',
    faq3Answer: 'كل عملية تستهلك رصيد. يمكنك شراء باقات. الرصيد ينتهي بعد ٩٠ يوم.',
    faq4Question: 'لماذا الإعلان المجاني مدموغ؟',
    faq4Answer: 'التجارب المجانية دائمًا مدموغة. المدفوعة دائمًا نظيفة.',
    faq5Question: 'ماذا أفعل إذا فشلت العملية؟',
    faq5Answer: 'تواصل مع الدعم لطلب استرجاع الرصيد.',
    faq6Question: 'هل يمكنني استخدام الفيديو تجاريًا؟',
    faq6Answer: 'نعم، طالما أنك تملك الملفات المرفوعة وتحترم الشروط.',
    faq7Question: 'ما هي اللغات المدعومة؟',
    faq7Answer: 'العربية والإنجليزية. المزيد قريبًا.',
    
    // Common UI Elements (Arabic)
    loading: 'جارٍ التحميل...',
    error: 'خطأ',
    success: 'نجح',
    cancel: 'إلغاء',
    confirm: 'تأكيد',
    delete: 'حذف',
    edit: 'تعديل',
    view: 'عرض',
    close: 'إغلاق',
    next: 'التالي',
    previous: 'السابق',
    back: 'رجوع',
    continue: 'متابعة',
    apply: 'تطبيق',
    reset: 'إعادة تعيين',
    refresh: 'تحديث',
    
    // Form Elements (Arabic)
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    confirmPassword: 'تأكيد كلمة المرور',
    submit: 'إرسال',
    required: 'مطلوب',
    optional: 'اختياري',
    placeholder: 'أدخل النص...',
    
    // Pages Content (Arabic)
    templatesSubtitle: 'اكتشف مجموعتنا من القوالب السينمائية لتحويل صورك.',
    exploreTemplates: 'استكشف القوالب السينمائية لمشاريعك',
    viewPastGenerations: 'عرض الأجيال والمشاريع السابقة',
    purchaseCredits: 'شراء الرصيد لإنشاء المحتوى',
    recentJobs: 'الوظائف الأخيرة',
    
    // Auth Pages (Arabic)
    createAccount: 'إنشاء حساب',
    emailPlaceholder: 'أدخل بريدك الإلكتروني',
    passwordPlaceholder: 'أدخل كلمة المرور',
    confirmPasswordPlaceholder: 'تأكيد كلمة المرور',
    signUpAccount: 'سجل حسابك',
    alreadyHaveAccountPrefix: 'لديك حساب بالفعل؟',
    dontHaveAccount: 'ليس لديك حساب؟',
    
    // Guest Registration (Arabic)
    saveYourResult: 'احفظ نتيجتك',
    registerToSave: 'سجّل لحفظ ومشاركة إبداعك',
    enterEmail: 'أدخل بريدك الإلكتروني',
    enterPassword: 'أدخل كلمة المرور',
    confirmYourPassword: 'تأكيد كلمة المرور',
    
    // Common Messages (Arabic)
    cookieMessage: 'نستخدم ملفات تعريف الارتباط لتحسين راوي. باستخدام الموقع توافق على سياسة الخصوصية.',
    acceptCookies: 'موافق',
    declineCookies: 'رفض',
    learnMore: 'اعرف المزيد',
    dismiss: 'إغلاق',
    
    // Error Messages (Arabic)
    invalidEmail: 'تنسيق البريد الإلكتروني غير صحيح',
    passwordsDoNotMatch: 'كلمات المرور غير متطابقة',
    accountCreatedSuccess: 'تم إنشاء الحساب بنجاح! تم حفظ مهمتك في حسابك.',
    createAccountFailed: 'فشل في إنشاء الحساب. حاول مرة أخرى.',
    creatingAccount: 'جارٍ إنشاء الحساب...',
    createAccountAndSave: 'إنشاء حساب وحفظ المهمة',
    byCreatingAccount: 'بإنشاء حساب، توافق على شروطنا وسياسة الخصوصية',
    
    // Guest Registration Full (Arabic)
    saveYourResultCreate: 'احفظ نتيجتك - إنشاء حساب',
    
    // Storyboard Page (Arabic)
    storyboardPlayground: 'ملعب القصة المصورة',
    createPersonalizedStoryboard: 'أنشئ قصتك المصورة الشخصية من خلال ملء التفاصيل أدناه',
    storyboardTemplate: 'القالب',
    loadingTemplates: 'جارٍ تحميل القوالب...',
    selectTemplate: 'اختر قالباً',
    leadCharacter: 'الشخصية الرئيسية',
    leadName: 'الاسم',
    enterLeadCharacterName: 'أدخل اسم الشخصية الرئيسية',
    gender: 'الجنس',
    selectGender: 'اختر الجنس',
    male: 'ذكر',
    female: 'أنثى',
    aiGeneratedCharacter: 'شخصية مولدة بالذكاء الاصطناعي',
    faceReferenceImage: 'صورة مرجعية للوجه',
    uploadFaceReference: 'ارفع صورة مرجعية للوجه',
    chooseImage: 'اختر صورة',
    supportingCharacters: 'الشخصيات المساعدة',
    supportingCharactersDesc: 'سيتم إنشاء الشخصيات المساعدة تلقائياً بناءً على الحبكة والقالب.',
    supportingCharacter: 'الشخصية المساعدة',
    figureFromPlot: 'شخصية من الحبكة',
    aiGeneratedFace: 'وجه مولد بالذكاء الاصطناعي',
    addSupportingCharacter: 'أضف شخصية مساعدة',
    genres: 'الأنواع',
    selectGenresDesc: 'اختر حتى 3 أنواع تناسب قصتك',
    voiceAndLanguage: 'الصوت واللغة',
    accent: 'اللهجة',
    storyPrompt: 'موجه القصة',
    describeStoryScene: 'صف قصتك أو مشهدك بالتفصيل',
    createStoryboard: 'أنشئ القصة المصورة',
    creating: 'جارٍ الإنشاء...',
    
    // Error Messages - Storyboard (Arabic)
    fileTooLarge: 'الملف كبير جداً',
    imageUnder5MB: 'يرجى اختيار صورة أقل من 5 ميجابايت',
    missingFields: 'حقول مفقودة',
    fillAllRequired: 'يرجى ملء جميع الحقول المطلوبة بما في ذلك اختيار القالب',
    missingGenres: 'أنواع مفقودة',
    selectAtLeastOneGenre: 'يرجى اختيار نوع واحد على الأقل',
    insufficientCredits: 'رصيد غير كافٍ',
    needCreditsMessage: 'تحتاج إلى {credits} رصيد لبدء هذه المهمة. يرجى شراء المزيد من الرصيد.',
    storyboardJobCreated: 'تم إنشاء مهمة القصة المصورة!',
    processingRedirecting: 'قصتك المصورة قيد المعالجة. جارٍ التوجيه إلى صفحة الحالة...',
    unexpectedError: 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.',
    
    // Common Status Messages (Arabic)
    warning: 'تحذير',
    couldNotLoadTemplates: 'لا يمكن تحميل القوالب. يمكنك المتابعة دون اختيار قالب.',
    
    // Additional storyboard translations (Arabic)
    consentRequired: 'الموافقة مطلوبة',
    consentRequiredDescription: 'يجب الموافقة على شروطنا وسياسة الملكية الفكرية لإنشاء القصة المصورة',
    
    // Additional Storyboard Elements (Arabic)
    maxOneSupportingChar: '(حد أقصى 1)',
    supportingCharCount: '({count}/1)',
    voiceLanguage: 'اللغة',
    selectLanguage: 'اختر اللغة',
    selectAccent: 'اختر اللهجة',
    genresMax3: 'الأنواع * (حد أقصى 3)',
    selectedGenres: 'المختار: {genres} ({count}/3)',
    plotInstructions: 'الحبكة والتعليمات (اختياري)',
    plotPlaceholder: 'صف حبكة قصتك أو قدم تعليمات محددة. مثال: \'إثارة حول محقش في باريس\' أو \'العنوان: الموقف الأخير - مغامرة خيال علمي...\'',
    creatingStoryboard: 'جارٍ إنشاء القصة المصورة...',
    
    // Size Options (Arabic)
    sizeOption: 'حجم الإخراج *',
    sizePortrait: 'عمودي (موبايل)',
    sizeLandscape: 'أفقي (شاشة عريضة)',
    selectSize: 'اختر حجم الإخراج',
    
    // Storyboard Workspace (Arabic)
    'Failed to load storyboard job': 'فشل في تحميل مهمة القصة المصورة',
    'An unexpected error occurred': 'حدث خطأ غير متوقع',
    'Storyboard not found': 'القصة المصورة غير موجودة',
    'Back to Dashboard': 'العودة إلى لوحة التحكم',
    'Storyboard Workspace': 'مساحة عمل القصة المصورة',
    'Job ID': 'معرف المهمة',
    'Status': 'الحالة',
    'Job Information': 'معلومات المهمة',
    'Not specified': 'غير محدد',
    'Movie Information': 'معلومات الفيلم',
    'Generate': 'إنشاء',
    'Movie Title': 'عنوان الفيلم',
    'Enter movie title': 'أدخل عنوان الفيلم',
    'Movie Plot (Logline)': 'حبكة الفيلم (خط القصة)',
    'Enter movie plot/logline': 'أدخل حبكة الفيلم/خط القصة',
    'World': 'العالم',
    'Enter world setting': 'أدخل إعداد العالم',
    'Look': 'المظهر',
    'Enter visual style/look': 'أدخل الأسلوب البصري/المظهر',
    'Character Development': 'تطوير الشخصيات',
    'Character development section - coming soon': 'قسم تطوير الشخصيات - قريباً',
    'Scene Planning': 'تخطيط المشاهد',
    'Scene planning section - coming soon': 'قسم تخطيط المشاهد - قريباً',
    'Movie information saved': 'تم حفظ معلومات الفيلم',
    'Generate function will be implemented': 'سيتم تنفيذ وظيفة الإنشاء',
    'Generate Storyboard': 'إنشاء القصة المصورة',
    'Regenerate': 'إعادة إنشاء',
    'Complete first generation to view/edit details': 'أكمل الإنشاء الأول لعرض/تعديل التفاصيل',
    'Save': 'حفظ',
    'Cancel': 'إلغاء',
    'Lead Character': 'الشخصية الرئيسية',
    'Language': 'اللغة',
    'Accent': 'اللهجة',
    'Genres': 'الأنواع',
    'Job information saved': 'تم حفظ معلومات المهمة',
    'Failed to save job information': 'فشل في حفظ معلومات المهمة',
    'Enter lead character name': 'أدخل اسم الشخصية الرئيسية',
    'Enter gender': 'أدخل الجنس',
    'Enter language': 'أدخل اللغة',
    'Enter accent': 'أدخل اللهجة',
    'Enter size': 'أدخل الحجم',
    'Enter prompt': 'أدخل التوجيه',
    'Enter genres separated by commas': 'أدخل الأنواع مفصولة بفواصل',
    'Prompt': 'التوجيه',
    'Size': 'الحجم',
    'Last updated': 'آخر تحديث',
    'AI Generated Character': 'شخصية مولدة بالذكاء الاصطناعي',
    'Face Reference': 'مرجع الوجه',
    'Face image uploaded': 'تم رفع صورة الوجه',
    'No face image uploaded': 'لم يتم رفع صورة وجه',
    'Supporting Characters': 'الشخصيات المساعدة',
    'Character name': 'اسم الشخصية',
    'AI Generated Face': 'وجه مولد بالذكاء الاصطناعي',
    'Unnamed': 'بدون اسم',
    'Unspecified gender': 'جنس غير محدد',
    'Custom face image': 'صورة وجه مخصصة',
    'No face image': 'لا توجد صورة وجه',
    'Yes': 'نعم',
    'No': 'لا',
    'No storyboards found': 'لم يتم العثور على قصص مصورة',
    'Create Your First Storyboard': 'إنشاء أول قصة مصورة لك',
    'View Progress': 'عرض التقدم',
    
    // Language and Accent Options (Arabic)
    englishLang: 'الإنجليزية',
    arabicLang: 'العربية',
    accentUS: 'أمريكي',
    accentUK: 'بريطاني',
    accentEgyptian: 'مصري',
    accentMSA: 'فصحى',
    accentGulf: 'خليجي',
    accentLevantine: 'شامي',
    
    // Genre Options (Arabic)
    genreAction: 'أكشن',
    genreAdventure: 'مغامرة',
    genreComedy: 'كوميديا',
    genreDrama: 'دراما',
    genreFantasy: 'خيال',
    genreHorror: 'رعب',
    genreMystery: 'غموض',
    genreRomance: 'رومانسي',
    genreSciFi: 'خيال علمي',
    genreThriller: 'إثارة',
    genreDocumentary: 'وثائقي',
    genreAnimation: 'رسوم متحركة',
    
    // Additional Storyboard Workspace keys (Arabic)
    storyboardWorkspace: 'مساحة عمل اللوحة المصورة',
    initialInput: 'المدخلات الأولية',
    editing: 'تحرير',
    notSpecified: 'غير محدد',
    movieInformation: 'معلومات الفيلم',
    characters: 'الشخصيات',
    propsAndItems: 'الدعائم والعناصر',
    timelineAndShots: 'الجدول الزمني واللقطات',
    musicAndAudio: 'الموسيقى والصوت',
    generateCharacters: 'توليد الشخصيات',
    generateProps: 'توليد الدعائم',
    generateTimeline: 'توليد الجدول الزمني',
    generateMusic: 'توليد الموسيقى',
    completeGeneration: 'إكمال التوليد',
    backToDashboard: 'العودة إلى لوحة التحكم',
    cost: 'التكلفة',
    balance: 'الرصيد',
    describeYourStory: 'اصف قصتك',
    
    // Wallet (Arabic)
    walletTitle: 'محفظة',
    walletDescription: 'إدارة رصيدك واشتراكاتك',
    walletCurrentBalance: 'الرصيد الحالي',
    walletCredits: 'نقاط',
    walletCreditsNeverExpire: 'النقاط لا تنتهي الصلاحية أبداً',
    walletOneTimeCreditPacks: 'حزم النقاط لمرة واحدة',
    walletSubscriptionsWeekly: 'اشتراكات (أسبوعية)',
    walletDiscountRules: 'قواعد الخصم',
    walletDiscount0to49: '0–49 ن → 0% خصم',
    walletDiscount50to99: '50–99 ن → 10% خصم',
    walletDiscount100to249: '100–249 ن → 20% خصم',
    walletDiscount250plus: '250+ ن → 30% خصم',
    walletOff: 'خصم',
    walletProcessing: 'جاري المعالجة',
    walletBuyNow: 'اشتري الآن',
    walletCustomAmount: 'كمية مخصصة',
    walletCustomAmountDescription: 'اختر بالضبط كم عدد النقاط التي تحتاجها (الحد الأدنى 10)',
    walletOrEnterExactAmount: 'أو أدخل المبلغ الدقيق',
    walletEnterCredits: 'أدخل النقاط',
    walletOrderSummary: 'ملخص الطلب',
    walletRate: 'السعر',
    walletPurchaseCredits: 'شراء النقاط',
    walletSubscriptionBenefit: 'دائماً أرخص بحوالي 10% من الحزم لمرة واحدة!',
    walletWeeklyAutoRenewal: 'تجديد تلقائي أسبوعي مع خصومات أعلى (تصل إلى 40%)',
    walletSameEntryPoint: 'نفس نقطة البداية 20 نقطة لسهولة الوصول',
    walletCancelAnytime: 'إلغاء في أي وقت عبر بوابة العميل',
    walletManageSubscriptions: 'إدارة الاشتراكات',
    walletCheaperThanOneTime: 'أرخص من المرة الواحدة',
    walletWeek: 'أسبوع',
    walletPerCredit: 'لكل نقطة',
    walletVsOneTime: 'مقابل مرة واحدة',
    walletSubscribeNow: 'اشترك الآن',
    walletTransactionHistory: 'تاريخ المعاملات',
    walletTransactionHistoryDescription: 'عرض مشتريات النقاط والاشتراكات الأخيرة',
    
    // Storyboard Workspace (Arabic)
    generateMovieInfo: 'إنشاء معلومات الفيلم',
    lastUpdated: 'آخر تحديث',
    notAvailable: 'غير متوفر',
    priceLabel: 'السعر',
    movieTitle: 'عنوان الفيلم',
    movieLogline: 'ملخص الفيلم',
    movieWorld: 'عالم الفيلم',
    movieLook: 'مظهر الفيلم',
    enterMovieTitle: 'أدخل عنوان الفيلم',
    enterMovieLogline: 'أدخل ملخص الفيلم',
    enterMovieWorld: 'أدخل عالم الفيلم',
    enterMovieLook: 'أدخل مظهر الفيلم',
    regenerateStoryboard: 'إعادة إنشاء القصة المصورة',
    
    // Simple field labels (Arabic)
    logline: 'الملخص',
    world: 'العالم',
    look: 'المظهر',
  }
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize language from localStorage or default to 'en'
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('rawi-language');
      return (saved === 'ar' || saved === 'en') ? saved : 'en';
    }
    return 'en';
  });

  const isRTL = language === 'ar';

  // Update language and persist to localStorage
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('rawi-language', lang);
    }
  };

  // Update HTML attributes when language changes
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('lang', language);
      document.documentElement.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
      
      // Update the title based on language
      if (language === 'ar') {
        document.title = 'تطبيق راوي - حوّل صورك إلى لقطات سينمائية';
      } else {
        document.title = 'Rawi App - Turn Your Photos Into Cinematic Moments';
      }
    }
  }, [language, isRTL]);

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations[typeof language]] || key;
  };

  const value: LanguageContextType = {
    language,
    setLanguage,
    t,
    isRTL,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};