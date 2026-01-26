/**
 * Populate languages and countries tables
 * - Languages: French and English only
 * - Countries: All countries with names in French and English
 */

import Surreal from 'surrealdb';

const LANGUAGES = [
  { code: 'fr', name_fr: 'Français', name_en: 'French', flag: '🇫🇷', is_default: true },
  { code: 'en', name_fr: 'Anglais', name_en: 'English', flag: '🇬🇧', is_default: false }
];

const COUNTRIES = [
  { code: 'AF', name_fr: 'Afghanistan', name_en: 'Afghanistan', flag: '🇦🇫' },
  { code: 'ZA', name_fr: 'Afrique du Sud', name_en: 'South Africa', flag: '🇿🇦' },
  { code: 'AL', name_fr: 'Albanie', name_en: 'Albania', flag: '🇦🇱' },
  { code: 'DZ', name_fr: 'Algérie', name_en: 'Algeria', flag: '🇩🇿' },
  { code: 'DE', name_fr: 'Allemagne', name_en: 'Germany', flag: '🇩🇪' },
  { code: 'AD', name_fr: 'Andorre', name_en: 'Andorra', flag: '🇦🇩' },
  { code: 'AO', name_fr: 'Angola', name_en: 'Angola', flag: '🇦🇴' },
  { code: 'AG', name_fr: 'Antigua-et-Barbuda', name_en: 'Antigua and Barbuda', flag: '🇦🇬' },
  { code: 'SA', name_fr: 'Arabie saoudite', name_en: 'Saudi Arabia', flag: '🇸🇦' },
  { code: 'AR', name_fr: 'Argentine', name_en: 'Argentina', flag: '🇦🇷' },
  { code: 'AM', name_fr: 'Arménie', name_en: 'Armenia', flag: '🇦🇲' },
  { code: 'AU', name_fr: 'Australie', name_en: 'Australia', flag: '🇦🇺' },
  { code: 'AT', name_fr: 'Autriche', name_en: 'Austria', flag: '🇦🇹' },
  { code: 'AZ', name_fr: 'Azerbaïdjan', name_en: 'Azerbaijan', flag: '🇦🇿' },
  { code: 'BS', name_fr: 'Bahamas', name_en: 'Bahamas', flag: '🇧🇸' },
  { code: 'BH', name_fr: 'Bahreïn', name_en: 'Bahrain', flag: '🇧🇭' },
  { code: 'BD', name_fr: 'Bangladesh', name_en: 'Bangladesh', flag: '🇧🇩' },
  { code: 'BB', name_fr: 'Barbade', name_en: 'Barbados', flag: '🇧🇧' },
  { code: 'BE', name_fr: 'Belgique', name_en: 'Belgium', flag: '🇧🇪' },
  { code: 'BZ', name_fr: 'Belize', name_en: 'Belize', flag: '🇧🇿' },
  { code: 'BJ', name_fr: 'Bénin', name_en: 'Benin', flag: '🇧🇯' },
  { code: 'BT', name_fr: 'Bhoutan', name_en: 'Bhutan', flag: '🇧🇹' },
  { code: 'BY', name_fr: 'Biélorussie', name_en: 'Belarus', flag: '🇧🇾' },
  { code: 'MM', name_fr: 'Birmanie', name_en: 'Myanmar', flag: '🇲🇲' },
  { code: 'BO', name_fr: 'Bolivie', name_en: 'Bolivia', flag: '🇧🇴' },
  { code: 'BA', name_fr: 'Bosnie-Herzégovine', name_en: 'Bosnia and Herzegovina', flag: '🇧🇦' },
  { code: 'BW', name_fr: 'Botswana', name_en: 'Botswana', flag: '🇧🇼' },
  { code: 'BR', name_fr: 'Brésil', name_en: 'Brazil', flag: '🇧🇷' },
  { code: 'BN', name_fr: 'Brunei', name_en: 'Brunei', flag: '🇧🇳' },
  { code: 'BG', name_fr: 'Bulgarie', name_en: 'Bulgaria', flag: '🇧🇬' },
  { code: 'BF', name_fr: 'Burkina Faso', name_en: 'Burkina Faso', flag: '🇧🇫' },
  { code: 'BI', name_fr: 'Burundi', name_en: 'Burundi', flag: '🇧🇮' },
  { code: 'KH', name_fr: 'Cambodge', name_en: 'Cambodia', flag: '🇰🇭' },
  { code: 'CM', name_fr: 'Cameroun', name_en: 'Cameroon', flag: '🇨🇲' },
  { code: 'CA', name_fr: 'Canada', name_en: 'Canada', flag: '🇨🇦' },
  { code: 'CV', name_fr: 'Cap-Vert', name_en: 'Cape Verde', flag: '🇨🇻' },
  { code: 'CF', name_fr: 'République centrafricaine', name_en: 'Central African Republic', flag: '🇨🇫' },
  { code: 'CL', name_fr: 'Chili', name_en: 'Chile', flag: '🇨🇱' },
  { code: 'CN', name_fr: 'Chine', name_en: 'China', flag: '🇨🇳' },
  { code: 'CY', name_fr: 'Chypre', name_en: 'Cyprus', flag: '🇨🇾' },
  { code: 'CO', name_fr: 'Colombie', name_en: 'Colombia', flag: '🇨🇴' },
  { code: 'KM', name_fr: 'Comores', name_en: 'Comoros', flag: '🇰🇲' },
  { code: 'KR', name_fr: 'Corée du Sud', name_en: 'South Korea', flag: '🇰🇷' },
  { code: 'KP', name_fr: 'Corée du Nord', name_en: 'North Korea', flag: '🇰🇵' },
  { code: 'CR', name_fr: 'Costa Rica', name_en: 'Costa Rica', flag: '🇨🇷' },
  { code: 'CI', name_fr: "Côte d'Ivoire", name_en: 'Ivory Coast', flag: '🇨🇮' },
  { code: 'HR', name_fr: 'Croatie', name_en: 'Croatia', flag: '🇭🇷' },
  { code: 'CU', name_fr: 'Cuba', name_en: 'Cuba', flag: '🇨🇺' },
  { code: 'DK', name_fr: 'Danemark', name_en: 'Denmark', flag: '🇩🇰' },
  { code: 'DJ', name_fr: 'Djibouti', name_en: 'Djibouti', flag: '🇩🇯' },
  { code: 'DM', name_fr: 'Dominique', name_en: 'Dominica', flag: '🇩🇲' },
  { code: 'EG', name_fr: 'Égypte', name_en: 'Egypt', flag: '🇪🇬' },
  { code: 'AE', name_fr: 'Émirats arabes unis', name_en: 'United Arab Emirates', flag: '🇦🇪' },
  { code: 'EC', name_fr: 'Équateur', name_en: 'Ecuador', flag: '🇪🇨' },
  { code: 'ER', name_fr: 'Érythrée', name_en: 'Eritrea', flag: '🇪🇷' },
  { code: 'ES', name_fr: 'Espagne', name_en: 'Spain', flag: '🇪🇸' },
  { code: 'EE', name_fr: 'Estonie', name_en: 'Estonia', flag: '🇪🇪' },
  { code: 'SZ', name_fr: 'Eswatini', name_en: 'Eswatini', flag: '🇸🇿' },
  { code: 'US', name_fr: 'États-Unis', name_en: 'United States', flag: '🇺🇸' },
  { code: 'ET', name_fr: 'Éthiopie', name_en: 'Ethiopia', flag: '🇪🇹' },
  { code: 'FJ', name_fr: 'Fidji', name_en: 'Fiji', flag: '🇫🇯' },
  { code: 'FI', name_fr: 'Finlande', name_en: 'Finland', flag: '🇫🇮' },
  { code: 'FR', name_fr: 'France', name_en: 'France', flag: '🇫🇷' },
  { code: 'GA', name_fr: 'Gabon', name_en: 'Gabon', flag: '🇬🇦' },
  { code: 'GM', name_fr: 'Gambie', name_en: 'Gambia', flag: '🇬🇲' },
  { code: 'GE', name_fr: 'Géorgie', name_en: 'Georgia', flag: '🇬🇪' },
  { code: 'GH', name_fr: 'Ghana', name_en: 'Ghana', flag: '🇬🇭' },
  { code: 'GR', name_fr: 'Grèce', name_en: 'Greece', flag: '🇬🇷' },
  { code: 'GD', name_fr: 'Grenade', name_en: 'Grenada', flag: '🇬🇩' },
  { code: 'GT', name_fr: 'Guatemala', name_en: 'Guatemala', flag: '🇬🇹' },
  { code: 'GN', name_fr: 'Guinée', name_en: 'Guinea', flag: '🇬🇳' },
  { code: 'GQ', name_fr: 'Guinée équatoriale', name_en: 'Equatorial Guinea', flag: '🇬🇶' },
  { code: 'GW', name_fr: 'Guinée-Bissau', name_en: 'Guinea-Bissau', flag: '🇬🇼' },
  { code: 'GY', name_fr: 'Guyana', name_en: 'Guyana', flag: '🇬🇾' },
  { code: 'HT', name_fr: 'Haïti', name_en: 'Haiti', flag: '🇭🇹' },
  { code: 'HN', name_fr: 'Honduras', name_en: 'Honduras', flag: '🇭🇳' },
  { code: 'HU', name_fr: 'Hongrie', name_en: 'Hungary', flag: '🇭🇺' },
  { code: 'IN', name_fr: 'Inde', name_en: 'India', flag: '🇮🇳' },
  { code: 'ID', name_fr: 'Indonésie', name_en: 'Indonesia', flag: '🇮🇩' },
  { code: 'IQ', name_fr: 'Irak', name_en: 'Iraq', flag: '🇮🇶' },
  { code: 'IR', name_fr: 'Iran', name_en: 'Iran', flag: '🇮🇷' },
  { code: 'IE', name_fr: 'Irlande', name_en: 'Ireland', flag: '🇮🇪' },
  { code: 'IS', name_fr: 'Islande', name_en: 'Iceland', flag: '🇮🇸' },
  { code: 'IL', name_fr: 'Israël', name_en: 'Israel', flag: '🇮🇱' },
  { code: 'IT', name_fr: 'Italie', name_en: 'Italy', flag: '🇮🇹' },
  { code: 'JM', name_fr: 'Jamaïque', name_en: 'Jamaica', flag: '🇯🇲' },
  { code: 'JP', name_fr: 'Japon', name_en: 'Japan', flag: '🇯🇵' },
  { code: 'JO', name_fr: 'Jordanie', name_en: 'Jordan', flag: '🇯🇴' },
  { code: 'KZ', name_fr: 'Kazakhstan', name_en: 'Kazakhstan', flag: '🇰🇿' },
  { code: 'KE', name_fr: 'Kenya', name_en: 'Kenya', flag: '🇰🇪' },
  { code: 'KG', name_fr: 'Kirghizistan', name_en: 'Kyrgyzstan', flag: '🇰🇬' },
  { code: 'KI', name_fr: 'Kiribati', name_en: 'Kiribati', flag: '🇰🇮' },
  { code: 'KW', name_fr: 'Koweït', name_en: 'Kuwait', flag: '🇰🇼' },
  { code: 'LA', name_fr: 'Laos', name_en: 'Laos', flag: '🇱🇦' },
  { code: 'LS', name_fr: 'Lesotho', name_en: 'Lesotho', flag: '🇱🇸' },
  { code: 'LV', name_fr: 'Lettonie', name_en: 'Latvia', flag: '🇱🇻' },
  { code: 'LB', name_fr: 'Liban', name_en: 'Lebanon', flag: '🇱🇧' },
  { code: 'LR', name_fr: 'Liberia', name_en: 'Liberia', flag: '🇱🇷' },
  { code: 'LY', name_fr: 'Libye', name_en: 'Libya', flag: '🇱🇾' },
  { code: 'LI', name_fr: 'Liechtenstein', name_en: 'Liechtenstein', flag: '🇱🇮' },
  { code: 'LT', name_fr: 'Lituanie', name_en: 'Lithuania', flag: '🇱🇹' },
  { code: 'LU', name_fr: 'Luxembourg', name_en: 'Luxembourg', flag: '🇱🇺' },
  { code: 'MK', name_fr: 'Macédoine du Nord', name_en: 'North Macedonia', flag: '🇲🇰' },
  { code: 'MG', name_fr: 'Madagascar', name_en: 'Madagascar', flag: '🇲🇬' },
  { code: 'MY', name_fr: 'Malaisie', name_en: 'Malaysia', flag: '🇲🇾' },
  { code: 'MW', name_fr: 'Malawi', name_en: 'Malawi', flag: '🇲🇼' },
  { code: 'MV', name_fr: 'Maldives', name_en: 'Maldives', flag: '🇲🇻' },
  { code: 'ML', name_fr: 'Mali', name_en: 'Mali', flag: '🇲🇱' },
  { code: 'MT', name_fr: 'Malte', name_en: 'Malta', flag: '🇲🇹' },
  { code: 'MA', name_fr: 'Maroc', name_en: 'Morocco', flag: '🇲🇦' },
  { code: 'MU', name_fr: 'Maurice', name_en: 'Mauritius', flag: '🇲🇺' },
  { code: 'MR', name_fr: 'Mauritanie', name_en: 'Mauritania', flag: '🇲🇷' },
  { code: 'MX', name_fr: 'Mexique', name_en: 'Mexico', flag: '🇲🇽' },
  { code: 'FM', name_fr: 'Micronésie', name_en: 'Micronesia', flag: '🇫🇲' },
  { code: 'MD', name_fr: 'Moldavie', name_en: 'Moldova', flag: '🇲🇩' },
  { code: 'MC', name_fr: 'Monaco', name_en: 'Monaco', flag: '🇲🇨' },
  { code: 'MN', name_fr: 'Mongolie', name_en: 'Mongolia', flag: '🇲🇳' },
  { code: 'ME', name_fr: 'Monténégro', name_en: 'Montenegro', flag: '🇲🇪' },
  { code: 'MZ', name_fr: 'Mozambique', name_en: 'Mozambique', flag: '🇲🇿' },
  { code: 'NA', name_fr: 'Namibie', name_en: 'Namibia', flag: '🇳🇦' },
  { code: 'NR', name_fr: 'Nauru', name_en: 'Nauru', flag: '🇳🇷' },
  { code: 'NP', name_fr: 'Népal', name_en: 'Nepal', flag: '🇳🇵' },
  { code: 'NI', name_fr: 'Nicaragua', name_en: 'Nicaragua', flag: '🇳🇮' },
  { code: 'NE', name_fr: 'Niger', name_en: 'Niger', flag: '🇳🇪' },
  { code: 'NG', name_fr: 'Nigeria', name_en: 'Nigeria', flag: '🇳🇬' },
  { code: 'NO', name_fr: 'Norvège', name_en: 'Norway', flag: '🇳🇴' },
  { code: 'NZ', name_fr: 'Nouvelle-Zélande', name_en: 'New Zealand', flag: '🇳🇿' },
  { code: 'OM', name_fr: 'Oman', name_en: 'Oman', flag: '🇴🇲' },
  { code: 'UG', name_fr: 'Ouganda', name_en: 'Uganda', flag: '🇺🇬' },
  { code: 'UZ', name_fr: 'Ouzbékistan', name_en: 'Uzbekistan', flag: '🇺🇿' },
  { code: 'PK', name_fr: 'Pakistan', name_en: 'Pakistan', flag: '🇵🇰' },
  { code: 'PW', name_fr: 'Palaos', name_en: 'Palau', flag: '🇵🇼' },
  { code: 'PS', name_fr: 'Palestine', name_en: 'Palestine', flag: '🇵🇸' },
  { code: 'PA', name_fr: 'Panama', name_en: 'Panama', flag: '🇵🇦' },
  { code: 'PG', name_fr: 'Papouasie-Nouvelle-Guinée', name_en: 'Papua New Guinea', flag: '🇵🇬' },
  { code: 'PY', name_fr: 'Paraguay', name_en: 'Paraguay', flag: '🇵🇾' },
  { code: 'NL', name_fr: 'Pays-Bas', name_en: 'Netherlands', flag: '🇳🇱' },
  { code: 'PE', name_fr: 'Pérou', name_en: 'Peru', flag: '🇵🇪' },
  { code: 'PH', name_fr: 'Philippines', name_en: 'Philippines', flag: '🇵🇭' },
  { code: 'PL', name_fr: 'Pologne', name_en: 'Poland', flag: '🇵🇱' },
  { code: 'PT', name_fr: 'Portugal', name_en: 'Portugal', flag: '🇵🇹' },
  { code: 'QA', name_fr: 'Qatar', name_en: 'Qatar', flag: '🇶🇦' },
  { code: 'CG', name_fr: 'République du Congo', name_en: 'Republic of the Congo', flag: '🇨🇬' },
  { code: 'CD', name_fr: 'République démocratique du Congo', name_en: 'Democratic Republic of the Congo', flag: '🇨🇩' },
  { code: 'DO', name_fr: 'République dominicaine', name_en: 'Dominican Republic', flag: '🇩🇴' },
  { code: 'CZ', name_fr: 'République tchèque', name_en: 'Czech Republic', flag: '🇨🇿' },
  { code: 'RO', name_fr: 'Roumanie', name_en: 'Romania', flag: '🇷🇴' },
  { code: 'GB', name_fr: 'Royaume-Uni', name_en: 'United Kingdom', flag: '🇬🇧' },
  { code: 'RU', name_fr: 'Russie', name_en: 'Russia', flag: '🇷🇺' },
  { code: 'RW', name_fr: 'Rwanda', name_en: 'Rwanda', flag: '🇷🇼' },
  { code: 'KN', name_fr: 'Saint-Kitts-et-Nevis', name_en: 'Saint Kitts and Nevis', flag: '🇰🇳' },
  { code: 'VC', name_fr: 'Saint-Vincent-et-les-Grenadines', name_en: 'Saint Vincent and the Grenadines', flag: '🇻🇨' },
  { code: 'LC', name_fr: 'Sainte-Lucie', name_en: 'Saint Lucia', flag: '🇱🇨' },
  { code: 'SB', name_fr: 'Salomon', name_en: 'Solomon Islands', flag: '🇸🇧' },
  { code: 'SV', name_fr: 'Salvador', name_en: 'El Salvador', flag: '🇸🇻' },
  { code: 'WS', name_fr: 'Samoa', name_en: 'Samoa', flag: '🇼🇸' },
  { code: 'SM', name_fr: 'Saint-Marin', name_en: 'San Marino', flag: '🇸🇲' },
  { code: 'ST', name_fr: 'Sao Tomé-et-Principe', name_en: 'São Tomé and Príncipe', flag: '🇸🇹' },
  { code: 'SN', name_fr: 'Sénégal', name_en: 'Senegal', flag: '🇸🇳' },
  { code: 'RS', name_fr: 'Serbie', name_en: 'Serbia', flag: '🇷🇸' },
  { code: 'SC', name_fr: 'Seychelles', name_en: 'Seychelles', flag: '🇸🇨' },
  { code: 'SL', name_fr: 'Sierra Leone', name_en: 'Sierra Leone', flag: '🇸🇱' },
  { code: 'SG', name_fr: 'Singapour', name_en: 'Singapore', flag: '🇸🇬' },
  { code: 'SK', name_fr: 'Slovaquie', name_en: 'Slovakia', flag: '🇸🇰' },
  { code: 'SI', name_fr: 'Slovénie', name_en: 'Slovenia', flag: '🇸🇮' },
  { code: 'SO', name_fr: 'Somalie', name_en: 'Somalia', flag: '🇸🇴' },
  { code: 'SD', name_fr: 'Soudan', name_en: 'Sudan', flag: '🇸🇩' },
  { code: 'SS', name_fr: 'Soudan du Sud', name_en: 'South Sudan', flag: '🇸🇸' },
  { code: 'LK', name_fr: 'Sri Lanka', name_en: 'Sri Lanka', flag: '🇱🇰' },
  { code: 'SE', name_fr: 'Suède', name_en: 'Sweden', flag: '🇸🇪' },
  { code: 'CH', name_fr: 'Suisse', name_en: 'Switzerland', flag: '🇨🇭' },
  { code: 'SR', name_fr: 'Suriname', name_en: 'Suriname', flag: '🇸🇷' },
  { code: 'SY', name_fr: 'Syrie', name_en: 'Syria', flag: '🇸🇾' },
  { code: 'TJ', name_fr: 'Tadjikistan', name_en: 'Tajikistan', flag: '🇹🇯' },
  { code: 'TZ', name_fr: 'Tanzanie', name_en: 'Tanzania', flag: '🇹🇿' },
  { code: 'TD', name_fr: 'Tchad', name_en: 'Chad', flag: '🇹🇩' },
  { code: 'TH', name_fr: 'Thaïlande', name_en: 'Thailand', flag: '🇹🇭' },
  { code: 'TL', name_fr: 'Timor oriental', name_en: 'Timor-Leste', flag: '🇹🇱' },
  { code: 'TG', name_fr: 'Togo', name_en: 'Togo', flag: '🇹🇬' },
  { code: 'TO', name_fr: 'Tonga', name_en: 'Tonga', flag: '🇹🇴' },
  { code: 'TT', name_fr: 'Trinité-et-Tobago', name_en: 'Trinidad and Tobago', flag: '🇹🇹' },
  { code: 'TN', name_fr: 'Tunisie', name_en: 'Tunisia', flag: '🇹🇳' },
  { code: 'TM', name_fr: 'Turkménistan', name_en: 'Turkmenistan', flag: '🇹🇲' },
  { code: 'TR', name_fr: 'Turquie', name_en: 'Turkey', flag: '🇹🇷' },
  { code: 'TV', name_fr: 'Tuvalu', name_en: 'Tuvalu', flag: '🇹🇻' },
  { code: 'UA', name_fr: 'Ukraine', name_en: 'Ukraine', flag: '🇺🇦' },
  { code: 'UY', name_fr: 'Uruguay', name_en: 'Uruguay', flag: '🇺🇾' },
  { code: 'VU', name_fr: 'Vanuatu', name_en: 'Vanuatu', flag: '🇻🇺' },
  { code: 'VA', name_fr: 'Vatican', name_en: 'Vatican City', flag: '🇻🇦' },
  { code: 'VE', name_fr: 'Venezuela', name_en: 'Venezuela', flag: '🇻🇪' },
  { code: 'VN', name_fr: 'Viêt Nam', name_en: 'Vietnam', flag: '🇻🇳' },
  { code: 'YE', name_fr: 'Yémen', name_en: 'Yemen', flag: '🇾🇪' },
  { code: 'ZM', name_fr: 'Zambie', name_en: 'Zambia', flag: '🇿🇲' },
  { code: 'ZW', name_fr: 'Zimbabwe', name_en: 'Zimbabwe', flag: '🇿🇼' }
];

async function populate() {
  const db = new Surreal();
  
  try {
    const url = process.env.SURREAL_URL;
    if (!url) throw new Error('SURREAL_URL not set');
    
    await db.connect(url + '/rpc');
    await db.signin({
      username: process.env.SURREAL_USER!,
      password: process.env.SURREAL_PASS!
    });
    await db.use({ namespace: 'papaours', database: 'dbpapaours' });
    console.log('✅ Connected to SurrealDB');
    
    // Define tables if they don't exist
    console.log('\n📦 Defining tables...');
    
    await db.query(`
      DEFINE TABLE langue SCHEMAFULL PERMISSIONS FULL;
      DEFINE FIELD code ON langue TYPE string;
      DEFINE FIELD name_fr ON langue TYPE string;
      DEFINE FIELD name_en ON langue TYPE string;
      DEFINE FIELD flag ON langue TYPE option<string>;
      DEFINE FIELD is_default ON langue TYPE bool DEFAULT false;
      DEFINE FIELD is_active ON langue TYPE bool DEFAULT true;
      DEFINE INDEX langue_code ON langue COLUMNS code UNIQUE;
    `);
    
    await db.query(`
      DEFINE TABLE pays SCHEMAFULL PERMISSIONS FULL;
      DEFINE FIELD code ON pays TYPE string;
      DEFINE FIELD name_fr ON pays TYPE string;
      DEFINE FIELD name_en ON pays TYPE string;
      DEFINE FIELD flag ON pays TYPE option<string>;
      DEFINE FIELD is_active ON pays TYPE bool DEFAULT true;
      DEFINE INDEX pays_code ON pays COLUMNS code UNIQUE;
    `);
    
    console.log('✅ Tables defined');
    
    // Clear existing data
    console.log('\n🗑️  Clearing existing data...');
    await db.query('DELETE langue');
    await db.query('DELETE pays');
    
    // Insert languages
    console.log('\n🌐 Inserting languages...');
    for (const lang of LANGUAGES) {
      await db.query(`
        CREATE langue CONTENT {
          code: $code,
          name_fr: $name_fr,
          name_en: $name_en,
          flag: $flag,
          is_default: $is_default,
          is_active: true
        }
      `, lang);
    }
    console.log(`✅ ${LANGUAGES.length} languages inserted`);
    
    // Insert countries
    console.log('\n🌍 Inserting countries...');
    let countryCount = 0;
    for (const country of COUNTRIES) {
      await db.query(`
        CREATE pays CONTENT {
          code: $code,
          name_fr: $name_fr,
          name_en: $name_en,
          flag: $flag,
          is_active: true
        }
      `, country);
      countryCount++;
    }
    console.log(`✅ ${countryCount} countries inserted`);
    
    // Summary
    const langCount = await db.query('SELECT count() FROM langue GROUP ALL');
    const paysCount = await db.query('SELECT count() FROM pays GROUP ALL');
    
    console.log('\n📊 Summary:');
    console.log(`   Languages: ${(langCount[0] as any[])?.[0]?.count || 0}`);
    console.log(`   Countries: ${(paysCount[0] as any[])?.[0]?.count || 0}`);
    
    console.log('\n✅ Population complete!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await db.close();
  }
}

populate();
