module.exports = {
  app: {
    name: 'My Budget'
  },

  nav: {
    dashboard: 'Töölaud',
    categories: 'Kategooriad',
    transactions: 'Tehingud',
    wishlist: 'Soovinimekiri',
    calendar: 'Kalender',
    family: 'Pere',
    account: 'Konto seaded',
    logout: 'Logi välja',
    login: 'Logi sisse',
    register: 'Registreeru'
  },

  language: {
    label: 'Keel',
    english: 'English',
    russian: 'Русский',
    estonian: 'Eesti',
    short: {
      en: 'EN',
      ru: 'RU',
      et: 'ET'
    }
  },

  accessibility: {
    openAccountMenu: 'Ava konto menüü',
    toggleNavigation: 'Ava navigeerimine',
    userAvatar: 'Kasutaja avatar'
  },

  auth: {
    accountAccess: 'Konto juurdepääs',
    accountRecovery: 'Konto taastamine',
    emailVerification: 'E-posti kinnitamine',
    newAccount: 'Uus konto',

    loginTitle: 'Sisselogimine',
    loginText: 'Logi sisse, et jätkata oma eelarve haldamist.',
    registerTitle: 'Registreerimine',
    registerText: 'Loo konto, et alustada eelarve haldamist. Enne sisselogimist tuleb e-post kinnitada.',
    forgotPasswordTitle: 'Unustasid parooli',
    forgotPasswordText: 'Sisesta kinnitatud e-post ja saadame parooli lähtestamise lingi.',
    resetPasswordTitle: 'Parooli lähtestamine',
    resetPasswordText: 'Loo oma kontole uus turvaline parool.',
    resendVerificationTitle: 'Saada kinnituskiri uuesti',
    resendVerificationText: 'Sisesta e-post ja saadame uue kinnituse lingi, kui konto ei ole veel kinnitatud.',

    name: 'Nimi',
    email: 'Email',
    password: 'Parool',
    newPassword: 'Uus parool',
    confirmPassword: 'Kinnita parool',

    namePlaceholder: 'Sisesta nimi',
    emailPlaceholder: 'Sisesta email',
    passwordPlaceholder: 'Sisesta parool',
    createPasswordPlaceholder: 'Loo parool',
    confirmPasswordPlaceholder: 'Korda parooli',
    newPasswordPlaceholder: 'Loo uus parool',
    repeatNewPasswordPlaceholder: 'Korda uut parooli',

    passwordHint: 'Kasuta vähemalt 8 märki: suur- ja väiketäht, number ning erimärk.',

    signIn: 'Logi sisse',
    createAccount: 'Loo konto',
    sendResetLink: 'Saada link',
    changePassword: 'Muuda parool',
    sendVerificationEmail: 'Saada kinnituskiri',

    forgotPassword: 'Unustasid parooli?',
    resendVerificationEmail: 'Saada kinnituskiri uuesti',
    noAccount: 'Kontot pole?',
    createOneHere: 'Loo konto siin',
    alreadyHaveAccount: 'Konto on juba olemas?',
    signInHere: 'Logi siin sisse',
    rememberedPassword: 'Parool tuli meelde?',
    backToLogin: 'Tagasi sisselogimisele',
    requestNewResetLink: 'Küsi uus lähtestamise link',

    messages: {
      enterEmailAndPassword: 'Sisesta email ja parool.',
      invalidEmailOrPassword: 'Vale email või parool.',
      verifyEmailBeforeLogin: 'Kinnita email enne sisselogimist. Allpool saad küsida uue kinnituskirja.',
      failedToSignIn: 'Sisselogimine ebaõnnestus. Proovi uuesti.',
      fillAllFields: 'Täida kõik väljad.',
      invalidEmail: 'Sisesta korrektne email.',
      passwordsDoNotMatch: 'Paroolid ei kattu.',
      userAlreadyExists: 'Selle emailiga kasutaja on juba olemas.',
      accountCreated: 'Konto on loodud. Kontrolli e-posti ja kinnita konto enne sisselogimist.',
      emailNotConfigured: 'Emailide saatmine ei ole seadistatud. Kontrolli SMTP seadeid .env failis.',
      failedToRegister: 'Kasutaja registreerimine ebaõnnestus. Proovi uuesti.',
      verificationInvalid: 'Kinnituslink on vigane või aegunud. Küsi uus kinnituskiri.',
      emailVerified: 'Email on kinnitatud. Nüüd saad sisse logida.',
      failedToVerifyEmail: 'Emaili kinnitamine ebaõnnestus. Proovi uuesti.',
      verificationSentIfNeeded: 'Kui see email on olemas ja kinnitamata, saadeti uus kinnituse link.',
      emailAlreadyVerified: 'See email on juba kinnitatud. Saad sisse logida.',
      failedToSendVerification: 'Kinnituskirja saatmine ebaõnnestus. Proovi uuesti.',
      passwordInstructionsSent: 'Kui see email on süsteemis olemas, saadeti juhised sellele aadressile.',
      failedToSendEmail: 'Emaili saatmine ebaõnnestus. Proovi uuesti.',
      resetLinkInvalid: 'Lähtestamise link on vigane või aegunud. Küsi uus link.',
      failedToOpenResetPage: 'Lähtestamise lehe avamine ebaõnnestus. Proovi uuesti.',
      passwordChanged: 'Parool on muudetud. Nüüd saad uue parooliga sisse logida.',
      failedToChangePassword: 'Parooli muutmine ebaõnnestus. Proovi uuesti.'
    },

    passwordRules: {
      atLeastEightCharacters: 'vähemalt 8 märki',
      lowercase: 'üks väiketäht',
      uppercase: 'üks suurtäht',
      number: 'üks number',
      specialCharacter: 'üks erimärk',
      noSpaces: 'ilma tühikuteta',
      messagePrefix: 'Parool peab sisaldama'
    }
  }
,

  account: {
    pageTitle: 'Konto',
    personalWorkspace: 'Isiklik tööruum',
    title: 'Konto seaded',
    description: 'Halda profiili, avatari, parooli ja tööruumi ligipääsu ühes kohas.',
    avatar: 'Avatar',
    changeAvatar: 'Muuda avatari',
    familyAvatarAlt: 'Pere avatar',
    userAvatarAlt: 'Kasutaja avatar',
    memberSince: 'Konto loodud',
    avatarHelp: 'Klõpsa avataril, et laadida JPG või PNG · kuni 15 MB',
    deleteAvatar: 'Kustuta avatar',
    yourFamily: 'Sinu pere',
    yourRole: 'Sinu roll',
    ownerCrown: 'Omaniku kroon',
    profileSettings: 'Profiili seaded',
    name: 'Nimi',
    email: 'Email',
    saveChanges: 'Salvesta muudatused',
    changePassword: 'Muuda parooli',
    currentPassword: 'Praegune parool',
    currentPasswordPlaceholder: 'Sisesta praegune parool',
    newPassword: 'Uus parool',
    newPasswordPlaceholder: 'Sisesta uus parool',
    repeatNewPassword: 'Korda uut parooli',
    repeatNewPasswordPlaceholder: 'Korda uut parooli',
    updatePassword: 'Uuenda parooli',
    dangerZone: 'Ohtlik ala',
    dangerDescription: 'Konto kustutamine on lõplik ja seda ei saa tagasi võtta. Uuesti kasutamiseks tuleb luua uus konto.',
    deleteAccount: 'Kustuta konto',
    deleteAccountHint: 'Kinnitad selle modaalses aknas.',
    deleteAccountTitle: 'Kustuta konto jäädavalt',
    close: 'Sulge',
    deleteAccountWarning: 'Seda tegevust ei saa tagasi võtta. Avatar ja konto kirje kustutatakse jäädavalt.',
    typeDeletePrefix: 'Sisesta',
    typeDeleteSuffix: 'kinnitamiseks.',
    cancel: 'Tühista',
    deleteForever: 'Kustuta jäädavalt',

    roles: {
      owner: 'Omanik',
      editor: 'Muutja',
      viewer: 'Vaataja',
      personal: 'Isiklik'
    },

    messages: {
      failedToLoadAccount: 'Konto andmete laadimine ebaõnnestus.',
      nameEmailRequired: 'Nimi ja email on kohustuslikud.',
      invalidEmail: 'Sisesta korrektne email.',
      emailAlreadyUsed: 'See email on juba teise konto kasutuses.',
      accountUpdated: 'Konto andmed on uuendatud.',
      emailChangedVerify: 'Email on muudetud. Kinnita uus email enne sisselogimist.',
      emailNotConfiguredNotChanged: 'Emailide saatmine ei ole seadistatud. Emaili ei muudetud.',
      failedToUpdateAccount: 'Konto andmete uuendamine ebaõnnestus.',
      uploadJpgPngOnly: 'Laadi üles ainult JPG või PNG pilt.',
      failedToUploadAvatar: 'Avatari üleslaadimine ebaõnnestus.',
      avatarTooLarge: 'Avatari pilt peab olema kuni 15 MB.',
      chooseImageFirst: 'Vali esmalt pildifail.',
      avatarUpdated: 'Avatar on uuendatud.',
      failedToProcessAvatar: 'Avatari töötlemine ebaõnnestus. Laadi üles korrektne JPG või PNG pilt.',
      avatarDeleted: 'Avatar on kustutatud.',
      failedToDeleteAvatar: 'Avatari kustutamine ebaõnnestus.',
      fillPasswordFields: 'Täida kõik parooliväljad.',
      newPasswordsDoNotMatch: 'Uued paroolid ei kattu.',
      currentPasswordIncorrect: 'Praegune parool on vale.',
      passwordChanged: 'Parool on muudetud.',
      failedToChangePassword: 'Parooli muutmine ebaõnnestus.',
      typeDeleteToConfirm: 'Sisesta DELETE, et konto kustutamine kinnitada.',
      failedToDeleteAccount: 'Konto kustutamine ebaõnnestus. Proovi uuesti.'
    }
  }

};
