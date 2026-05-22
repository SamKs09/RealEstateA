module.exports = {
  // Auth - Registration
  missingFields: "Tous les champs n'ont pas été renseignés",
  invalidEmail: 'Adresse e-mail invalide',
  emailAlreadyRegistered: 'Cette adresse e-mail est déjà enregistrée',
  passwordTooShort: 'Le mot de passe doit comporter au moins 8 caractères',
  passwordsDoNotMatch: 'Les mots de passe ne correspondent pas',
  registrationSuccessEmail: (email) =>
    `Inscription réussie ! Un lien de vérification a été envoyé à ${email}. Veuillez consulter votre e-mail pour confirmer votre compte.`,
  registrationSuccessPhone:
    'Inscription réussie ! Confirmez votre numéro de téléphone avec le code SMS.',
  serverError: 'Erreur serveur. Veuillez réessayer plus tard.',
  invalidPhoneNumber: 'Numéro de téléphone invalide',
  phoneAlreadyRegistered: 'Ce numéro de téléphone est déjà enregistré',
  emailRequiredForVerification:
    "Un e-mail valide est requis pour la vérification du compte",

  // Auth - Verification
  userAlreadyVerified: "L'utilisateur est déjà vérifié",
  phoneAlreadyVerified: 'Ce numéro de téléphone est déjà vérifié',
  resendSuccess: "Lien d'activation renvoyé avec succès",
  otpSent: 'Code OTP envoyé avec succès',
  otpIncorrect: 'Code OTP incorrect',
  otpIncorrectOrExpired: 'Code OTP incorrect ou expiré',
  otpCodeLength: 'Le code doit comporter 6 chiffres',
  noPhoneInRequest: 'Aucun numéro de téléphone dans la requête',
  noCodeInRequest: 'Aucun code dans la requête',
  phoneVerified: 'Numéro de téléphone vérifié avec succès',
  verificationFailed: 'Échec de la vérification',
  userNotFound: 'Utilisateur introuvable',
  userNotRegistered: 'Utilisateur non enregistré',
  emailNotVerified:
    "Votre e-mail n'a pas encore été vérifié. Un nouveau lien de vérification a été envoyé",
  phoneNotVerified:
    "Votre numéro de téléphone n'a pas été vérifié. Un nouveau code a été envoyé",
  userWithPhoneNotFound: 'Aucun utilisateur trouvé avec ce numéro',

  // Auth - Login / Logout
  loginSuccess: 'Connexion réussie',
  logoutSuccess: 'Déconnexion réussie',
  alreadyLoggedOut: 'Déjà déconnecté',
  incorrectPassword: 'Mot de passe incorrect',

  // Auth - Password Reset
  emailRequired: "L'e-mail est requis",
  validEmailRequired: 'Veuillez fournir une adresse e-mail valide',
  noAccountWithEmail: 'Aucun compte trouvé avec cette adresse e-mail',
  passwordResetEmailSent:
    'Code de réinitialisation envoyé à votre adresse e-mail',
  failedToSendEmail: "Échec de l'envoi de l'e-mail. Veuillez réessayer",
  failedToGenerateTemplate: "Échec de la génération du modèle d'e-mail",
  emailOtpAndPasswordRequired:
    "L'e-mail, le code de vérification et le nouveau mot de passe sont requis",
  verificationCodeSixDigits:
    'Le code de vérification doit comporter 6 chiffres',
  invalidVerificationCode: 'Code de vérification invalide',
  verificationCodeExpired:
    'Le code de vérification a expiré. Veuillez en demander un nouveau',
  passwordResetSuccess: 'Le mot de passe a été réinitialisé avec succès',
  phoneRequired: 'Le numéro de téléphone est requis',
  validPhoneRequired: 'Veuillez fournir un numéro de téléphone valide',
  noAccountWithPhone: 'Aucun compte trouvé avec ce numéro de téléphone',
  resetCodeSentToPhone: 'Code de réinitialisation envoyé à votre téléphone',
  invalidPhoneFormat: 'Format de numéro de téléphone invalide',
  phoneNotMobile: "Le numéro de téléphone n'est pas un numéro mobile valide",
  failedToSendSms: "Échec de l'envoi du SMS. Veuillez réessayer",
  codePhonePasswordRequired:
    'Le code de vérification, le numéro de téléphone et le nouveau mot de passe sont requis',
  invalidOrExpiredCode: 'Code invalide ou expiré',
  failedToVerifyCode: 'Échec de la vérification du code. Veuillez réessayer',
  internalServerError:
    'Erreur interne du serveur. Veuillez réessayer plus tard',

  // User / Profile
  profileUpdated: 'Profil mis à jour avec succès',
  profileUpdateFailed: 'Échec de la mise à jour du profil',
  profileFetchFailed: 'Échec de la récupération du profil',
  basicProfileUpdateFailed: 'Échec de la mise à jour du profil de base',
  preferencesRequired: 'Les données de préférences sont requises',
  invalidPreferencesFormat: 'Format de préférences invalide',
  preferencesUpdated: 'Préférences mises à jour avec succès',
  preferencesUpdateFailed: 'Échec de la mise à jour des préférences',
  noAvatarFile: "Aucun fichier d'avatar fourni",
  avatarUploaded: "Avatar téléversé avec succès",
  avatarUploadFailed: "Échec du téléversement de l'avatar",
  // Favorites
  invalidPropertyId: 'Format d\'ID de propriété invalide',
  cannotFavoriteOwnProperty: 'Vous ne pouvez pas mettre en favori votre propre propriété',
  propertyAlreadyFavorited: 'Propriété déjà dans les favoris',
  addedToFavoriteProperties: 'Ajouté aux propriétés favorites',
  favoritePropertiesFetchFailed: 'Échec de la récupération des propriétés favorites',
  propertyNotInFavorites: "La propriété n'est pas dans les favoris",
  removedFromFavoriteProperties: 'Retiré des propriétés favorites',
  removeFavoritePropertyFailed: 'Échec de la suppression de la propriété des favoris',
  invalidVehicleId: 'Format d\'ID de véhicule invalide',
  cannotFavoriteOwnVehicle: 'Vous ne pouvez pas mettre en favori votre propre véhicule',
  vehicleAlreadyFavorited: 'Véhicule déjà dans les favoris',
  addedToFavoriteVehicles: 'Ajouté aux véhicules favoris',
  favoriteVehiclesFetchFailed: 'Échec de la récupération des véhicules favoris',
  vehicleNotInFavorites: "Le véhicule n'est pas dans les favoris",
  removedFromFavoriteVehicles: 'Retiré des véhicules favoris',
  removeFavoriteVehicleFailed: 'Échec de la suppression du véhicule des favoris',
  // Password
  currentAndNewPasswordRequired: 'Le mot de passe actuel et le nouveau sont requis',
  incorrectCurrentPassword: 'Le mot de passe actuel est incorrect',
  passwordChanged: 'Mot de passe modifié avec succès',
  passwordChangeFailed: 'Échec de la modification du mot de passe',

  // Properties
  propertyCreated: 'Propriété créée avec succès',
  propertyUpdated: 'Propriété mise à jour avec succès',
  propertyDeleted: 'Propriété supprimée avec succès',
  propertyNotFound: 'Propriété introuvable',
  propertyLiked: 'Propriété ajoutée aux favoris',
  propertyUnliked: 'Propriété retirée des favoris',
  mediaAdded: 'Médias ajoutés avec succès',
  mediaRemoved: 'Médias supprimés avec succès',
  availabilityUpdated: 'Disponibilité mise à jour avec succès',
  unauthorized: "Vous n'êtes pas autorisé à effectuer cette action",
  mediaNotFound: 'Médias introuvables',
  alreadyLiked: 'Propriété déjà dans les favoris',
  notLiked: "La propriété n'est pas dans les favoris de l'utilisateur",
  invalidListingTypeForPricing: "Type d'annonce invalide pour la tarification",
  invalidCoordinates: 'Coordonnées fournies invalides',
  invalidPropertyType: 'Type de propriété invalide',
  invalidListingType: "Type d'annonce invalide",
  invalidAreaUnit: 'Unité de surface invalide',
  invalidFurnishing: "Type d'ameublement invalide",
  invalidRentPeriod: 'Période de location invalide',
  invalidCurrency: 'Devise invalide',
  invalidStatus: 'Statut invalide',
  invalidDateRange:
    'La date de début doit être antérieure à la date de fin',

  // Vehicles
  vehicleCreated: 'Véhicule créé avec succès',
  vehicleUpdated: 'Véhicule mis à jour avec succès',
  vehicleDeleted: 'Véhicule supprimé avec succès',
  vehicleNotFound: 'Véhicule introuvable',
  vehicleLiked: 'Véhicule ajouté aux favoris',
  vehicleUnliked: 'Véhicule retiré des favoris',
  vehicleAlreadyLiked: 'Véhicule déjà dans les favoris',
  vehicleNotLiked: "Le véhicule n'est pas dans les favoris de l'utilisateur",
};
