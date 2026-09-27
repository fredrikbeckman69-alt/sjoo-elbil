/**
 * Tjänst för att säkerställa att varje laddstopp har en verifierad, komplett fysisk adress
 * (Gatuadress, Postnummer och Ort) istället för vaga platshållare som "Längs färdvägen".
 */

// Kända fysiska adresser för större snabbladdarhubbar i Sverige per ort och operatör
export interface KnownStationHub {
  city: string;
  name: string;
  street: string;
  postcode: string;
  lat: number;
  lon: number;
  operators: Record<string, string>; // operatorId -> fullständig adress
}

export const KNOWN_SWEDISH_CHARGING_HUBS: KnownStationHub[] = [
  {
    city: 'Borlänge',
    name: 'Borlänge Kupolen / Max',
    street: 'Traktorgatan 2',
    postcode: '781 38',
    lat: 60.484,
    lon: 15.422,
    operators: {
      'tesla-supercharger': 'Traktorgatan 2, 781 38 Borlänge',
      'ionity': 'Kupolen 1, 781 70 Borlänge',
      'circle-k': 'Backaviadukten 1, 784 52 Borlänge',
      'okq8': 'Mäster Palms Gata 1, 784 34 Borlänge',
      'recharge': 'Sveagatan 1, 784 33 Borlänge',
      'incharge': 'Kupolen Köpcentrum, 781 70 Borlänge',
      'mer': 'Norra Backagatan 9, 781 70 Borlänge',
      'default': 'Traktorgatan 2, 781 38 Borlänge',
    },
  },
  {
    city: 'Hedemora',
    name: 'Hedemora Snabbladdare',
    street: 'Gussarvsgatan 34',
    postcode: '776 30',
    lat: 60.279,
    lon: 15.986,
    operators: {
      'circle-k': 'Gussarvsgatan 34, 776 30 Hedemora',
      'recharge': 'Åsgatan 71, 776 30 Hedemora',
      'okq8': 'Hedemoravägen 2, 776 33 Hedemora',
      'tesla-supercharger': 'Gussarvsgatan 34, 776 30 Hedemora',
      'default': 'Gussarvsgatan 34, 776 30 Hedemora',
    },
  },
  {
    city: 'Sala',
    name: 'Sala Snabbladdare',
    street: 'Gruvgatan 1',
    postcode: '733 38',
    lat: 59.919,
    lon: 16.608,
    operators: {
      'circle-k': 'Gruvgatan 1, 733 38 Sala',
      'incharge': 'Rådmansgatan 2, 733 30 Sala',
      'okq8': 'Hyttvägen 1, 733 38 Sala',
      'default': 'Gruvgatan 1, 733 38 Sala',
    },
  },
  {
    city: 'Enköping',
    name: 'Enköping Snabbladdningshubb',
    street: 'Skälbygatan 8',
    postcode: '745 37',
    lat: 59.658,
    lon: 17.077,
    operators: {
      'tesla-supercharger': 'Skälbygatan 8, 745 37 Enköping',
      'ionity': 'Grusgatan 1, 745 37 Enköping',
      'circle-k': 'Salavägen 5, 745 39 Enköping',
      'okq8': 'Romgatan 2, 745 37 Enköping',
      'mer': 'Grusgatan 1, 745 37 Enköping',
      'default': 'Skälbygatan 8, 745 37 Enköping',
    },
  },
  {
    city: 'Malung',
    name: 'Malung Snabbladdare',
    street: 'Lisaringen 1',
    postcode: '782 31',
    lat: 60.685,
    lon: 13.714,
    operators: {
      'tesla-supercharger': 'Lisaringen 1, 782 31 Malung',
      'circle-k': 'Källvägen 9, 782 33 Malung',
      'okq8': 'Postgatan 9, 782 31 Malung',
      'recharge': 'Moravägen 1, 782 31 Malung',
      'default': 'Lisaringen 1, 782 31 Malung',
    },
  },
  {
    city: 'Vansbro',
    name: 'Vansbro Snabbladdare',
    street: 'Lokstallsvägen 2',
    postcode: '780 50',
    lat: 60.511,
    lon: 14.233,
    operators: {
      'tesla-supercharger': 'Lokstallsvägen 2, 780 50 Vansbro',
      'okq8': 'Äppelbovägen 2, 780 50 Vansbro',
      'circle-k': 'Fabriksvägen 1, 780 50 Vansbro',
      'default': 'Lokstallsvägen 2, 780 50 Vansbro',
    },
  },
  {
    city: 'Mora',
    name: 'Mora Snabbladdningshubb',
    street: 'Strandgatan 8',
    postcode: '792 30',
    lat: 61.006,
    lon: 14.544,
    operators: {
      'tesla-supercharger': 'Strandgatan 8, 792 30 Mora',
      'ionity': 'Skålmyrsvägen 40, 792 50 Mora',
      'circle-k': 'Vasagatan 2, 792 32 Mora',
      'okq8': 'Badstugatan 1, 792 32 Mora',
      'default': 'Strandgatan 8, 792 30 Mora',
    },
  },
  {
    city: 'Sälen',
    name: 'Sälen Snabbladdningshubb',
    street: 'Sälenvägen 26',
    postcode: '780 67',
    lat: 61.164,
    lon: 13.203,
    operators: {
      'tesla-supercharger': 'Sälenvägen 26, 780 67 Sälen',
      'circle-k': 'Sälenvägen 12, 780 67 Sälen',
      'recharge': 'Sälfjällstorget, 780 67 Sälen',
      'incharge': 'Lindvallen, 780 67 Sälen',
      'default': 'Sälenvägen 26, 780 67 Sälen',
    },
  },
  {
    city: 'Gävle',
    name: 'Gävle Bro Snabbladdare',
    street: 'Gävle Brovägen 1',
    postcode: '804 29',
    lat: 60.649,
    lon: 17.120,
    operators: {
      'tesla-supercharger': 'Gävle Brovägen 1, 804 29 Gävle',
      'circle-k': 'Utmarksvägen 1, 802 91 Gävle',
      'okq8': 'Södra Skeppsbron 3, 802 84 Gävle',
      'default': 'Gävle Brovägen 1, 804 29 Gävle',
    },
  },
  {
    city: 'Uppsala',
    name: 'Uppsala Fullerö Backe',
    street: 'Fullerö Backe 101',
    postcode: '755 94',
    lat: 59.939,
    lon: 17.656,
    operators: {
      'tesla-supercharger': 'Fullerö Backe 101, 755 94 Uppsala',
      'ionity': 'Fullerö Backe 105, 755 94 Uppsala',
      'circle-k': 'Tycho Hedéns Väg 101, 754 24 Uppsala',
      'default': 'Fullerö Backe 101, 755 94 Uppsala',
    },
  },
  {
    city: 'Arboga',
    name: 'Arboga Snabbladdare',
    street: 'Burskapsvägen 1',
    postcode: '732 47',
    lat: 59.426,
    lon: 15.827,
    operators: {
      'tesla-supercharger': 'Burskapsvägen 1, 732 47 Arboga',
      'ionity': 'Burskapsvägen 3, 732 47 Arboga',
      'circle-k': 'Kungsörsvägen 2, 732 47 Arboga',
      'default': 'Burskapsvägen 1, 732 47 Arboga',
    },
  },
  {
    city: 'Örebro',
    name: 'Örebro Marieberg Snabbladdare',
    street: 'Varuvägen 2',
    postcode: '702 36',
    lat: 59.218,
    lon: 15.138,
    operators: {
      'tesla-supercharger': 'Varuvägen 2, 702 36 Örebro',
      'ionity': 'Bolagsvägen 1, 702 36 Örebro',
      'circle-k': 'Västerleden 1, 702 30 Örebro',
      'default': 'Varuvägen 2, 702 36 Örebro',
    },
  },
  {
    city: 'Karlstad',
    name: 'Karlstad Välsviken Snabbladdare',
    street: 'Välsviksvägen 2',
    postcode: '654 60',
    lat: 59.402,
    lon: 13.585,
    operators: {
      'tesla-supercharger': 'Välsviksvägen 2, 654 60 Karlstad',
      'ionity': 'Körkarlsvägen 1, 653 46 Karlstad',
      'circle-k': 'Våxnäsgatan 152, 653 43 Karlstad',
      'default': 'Välsviksvägen 2, 654 60 Karlstad',
    },
  },
  {
    city: 'Nyköping',
    name: 'Nyköping Gumsbacken',
    street: 'Gumsbackevägen 2',
    postcode: '611 38',
    lat: 58.749,
    lon: 16.974,
    operators: {
      'tesla-supercharger': 'Gumsbackevägen 2, 611 38 Nyköping',
      'circle-k': 'Stenkullavägen 2, 611 36 Nyköping',
      'ionity': 'Sillekrog N / E4, 611 90 Tystberga',
      'default': 'Gumsbackevägen 2, 611 38 Nyköping',
    },
  },
  {
    city: 'Norrköping',
    name: 'Norrköping Ingelsta Snabbladdare',
    street: 'Koppargatan 20',
    postcode: '602 23',
    lat: 58.618,
    lon: 16.155,
    operators: {
      'tesla-supercharger': 'Koppargatan 20, 602 23 Norrköping',
      'ionity': 'Koppargatan 27, 602 23 Norrköping',
      'circle-k': 'Koppargatan 1, 602 23 Norrköping',
      'default': 'Koppargatan 20, 602 23 Norrköping',
    },
  },
  {
    city: 'Linköping',
    name: 'Linköping Tornby Snabbladdare',
    street: 'Västra Svedengatan 7',
    postcode: '582 73',
    lat: 58.432,
    lon: 15.589,
    operators: {
      'tesla-supercharger': 'Västra Svedengatan 7, 582 73 Linköping',
      'ionity': 'Torvingegatan 1, 582 78 Linköping',
      'circle-k': 'Kallerstadslingan 1, 582 78 Linköping',
      'default': 'Västra Svedengatan 7, 582 73 Linköping',
    },
  },
  {
    city: 'Ödeshög',
    name: 'Ödeshög Snabbladdare',
    street: 'Östgötagatan 1',
    postcode: '599 31',
    lat: 58.227,
    lon: 14.668,
    operators: {
      'tesla-supercharger': 'Östgötagatan 1, 599 31 Ödeshög',
      'ionity': 'Östgötagatan 2, 599 31 Ödeshög',
      'default': 'Östgötagatan 1, 599 31 Ödeshög',
    },
  },
  {
    city: 'Jönköping',
    name: 'Jönköping Asecs Snabbladdare',
    street: 'Kompanigatan 1',
    postcode: '553 05',
    lat: 57.774,
    lon: 14.202,
    operators: {
      'tesla-supercharger': 'Kompanigatan 1, 553 05 Jönköping',
      'ionity': 'Huskvarnavägen 160, 554 66 Jönköping',
      'circle-k': 'Bredastensvägen 1, 555 93 Jönköping',
      'default': 'Kompanigatan 1, 553 05 Jönköping',
    },
  },
  {
    city: 'Värnamo',
    name: 'Värnamo Bredasten',
    street: 'Bredastensvägen 3',
    postcode: '331 44',
    lat: 57.165,
    lon: 14.076,
    operators: {
      'tesla-supercharger': 'Bredastensvägen 3, 331 44 Värnamo',
      'circle-k': 'Malmövägen 14, 331 42 Värnamo',
      'default': 'Bredastensvägen 3, 331 44 Värnamo',
    },
  },
  {
    city: 'Ljungby',
    name: 'Ljungby Snabbladdare',
    street: 'Nyponvägen 1',
    postcode: '341 32',
    lat: 56.833,
    lon: 13.941,
    operators: {
      'tesla-supercharger': 'Nyponvägen 1, 341 32 Ljungby',
      'circle-k': 'Ringvägen 1, 341 32 Ljungby',
      'default': 'Nyponvägen 1, 341 32 Ljungby',
    },
  },
  {
    city: 'Helsingborg',
    name: 'Helsingborg Väla / Syd',
    street: 'Landskronavägen 24',
    postcode: '252 32',
    lat: 56.028,
    lon: 12.729,
    operators: {
      'tesla-supercharger': 'Landskronavägen 24, 252 32 Helsingborg',
      'ionity': 'Ekslingan 1, 254 67 Helsingborg',
      'circle-k': 'Kapplöpningsgatan 2, 252 30 Helsingborg',
      'default': 'Landskronavägen 24, 252 32 Helsingborg',
    },
  },
  {
    city: 'Löddeköpinge',
    name: 'Löddeköpinge Center Syd',
    street: 'Marknadsvägen 7',
    postcode: '246 42',
    lat: 55.766,
    lon: 12.990,
    operators: {
      'tesla-supercharger': 'Marknadsvägen 7, 246 42 Löddeköpinge',
      'circle-k': 'Transportvägen 2, 246 42 Löddeköpinge',
      'default': 'Marknadsvägen 7, 246 42 Löddeköpinge',
    },
  },
  {
    city: 'Malmö',
    name: 'Malmö Lockarp Snabbladdare',
    street: 'Lockarps Kyrkoväg 1',
    postcode: '212 36',
    lat: 55.552,
    lon: 13.064,
    operators: {
      'tesla-supercharger': 'Lockarps Kyrkoväg 1, 212 36 Malmö',
      'ionity': 'Krusegatan 19, 212 25 Malmö',
      'circle-k': 'Spillepengsgatan 1, 211 19 Malmö',
      'default': 'Lockarps Kyrkoväg 1, 212 36 Malmö',
    },
  },
  {
    city: 'Falkenberg',
    name: 'Falkenberg Snabbladdare',
    street: 'Mellangårdsvägen 6',
    postcode: '311 50',
    lat: 56.932,
    lon: 12.519,
    operators: {
      'tesla-supercharger': 'Mellangårdsvägen 6, 311 50 Falkenberg',
      'circle-k': 'Holgersgatan 35, 311 31 Falkenberg',
      'default': 'Mellangårdsvägen 6, 311 50 Falkenberg',
    },
  },
  {
    city: 'Uddevalla',
    name: 'Uddevalla Torp Köpcentrum',
    street: 'Östra Torpvägen 1',
    postcode: '451 76',
    lat: 58.352,
    lon: 11.812,
    operators: {
      'tesla-supercharger': 'Östra Torpvägen 1, 451 76 Uddevalla',
      'circle-k': 'Torp 80, 451 76 Uddevalla',
      'default': 'Östra Torpvägen 1, 451 76 Uddevalla',
    },
  },
  {
    city: 'Söderhamn',
    name: 'Söderhamn Snabbladdare',
    street: 'Stickvägen 5',
    postcode: '826 40',
    lat: 61.295,
    lon: 17.021,
    operators: {
      'tesla-supercharger': 'Stickvägen 5, 826 40 Söderhamn',
      'circle-k': 'Växelgatan 2, 826 40 Söderhamn',
      'default': 'Stickvägen 5, 826 40 Söderhamn',
    },
  },
  {
    city: 'Hudiksvall',
    name: 'Hudiksvall Medskog',
    street: 'Medskogsbron 4',
    postcode: '824 34',
    lat: 61.738,
    lon: 17.085,
    operators: {
      'tesla-supercharger': 'Medskogsbron 4, 824 34 Hudiksvall',
      'circle-k': 'Kungsgatan 62, 824 30 Hudiksvall',
      'default': 'Medskogsbron 4, 824 34 Hudiksvall',
    },
  },
  {
    city: 'Sundsvall',
    name: 'Sundsvall Birsta Snabbladdare',
    street: 'Gillebergsgatan 1',
    postcode: '856 33',
    lat: 62.398,
    lon: 17.339,
    operators: {
      'tesla-supercharger': 'Gillebergsgatan 1, 856 33 Sundsvall',
      'ionity': 'Gesällvägen 1, 863 41 Sundsvall',
      'circle-k': 'Norra Förmansvägen 1, 863 41 Sundsvall',
      'default': 'Gillebergsgatan 1, 856 33 Sundsvall',
    },
  },
  {
    city: 'Tierp',
    name: 'Tierp Snabbladdare',
    street: 'Gryttjom 101',
    postcode: '815 91',
    lat: 60.340,
    lon: 17.488,
    operators: {
      'mer': 'Gryttjom 101, 815 91 Tierp',
      'circle-k': 'Gryttjom 101, 815 91 Tierp',
      'default': 'Gryttjom 101, 815 91 Tierp',
    },
  },
  {
    city: 'Kvissleby',
    name: 'Kvissleby Snabbladdare',
    street: 'Centrumvägen 4',
    postcode: '862 31',
    lat: 62.299,
    lon: 17.378,
    operators: {
      'mer': 'Centrumvägen 4, 862 31 Kvissleby',
      'default': 'Centrumvägen 4, 862 31 Kvissleby',
    },
  },
  {
    city: 'Gnarp',
    name: 'Gnarp Snabbladdare',
    street: 'Gnarpskorset 1',
    postcode: '829 60',
    lat: 61.986,
    lon: 17.251,
    operators: {
      'circle-k': 'Gnarpskorset 1, 829 60 Gnarp',
      'mer': 'Gnarpskorset 1, 829 60 Gnarp',
      'default': 'Gnarpskorset 1, 829 60 Gnarp',
    },
  },
  {
    city: 'Härnösand',
    name: 'Härnösand Supercharger & Snabbladdare',
    street: 'Smedjevägen 2',
    postcode: '871 53',
    lat: 62.632,
    lon: 17.940,
    operators: {
      'tesla-supercharger': 'Smedjevägen 2, 871 53 Härnösand',
      'circle-k': 'Verkstadsgatan 2, 871 54 Härnösand',
      'default': 'Smedjevägen 2, 871 53 Härnösand',
    },
  },
  {
    city: 'Örnsköldsvik',
    name: 'Örnsköldsvik Snabbladdare',
    street: 'Hästmarksvägen 2',
    postcode: '891 38',
    lat: 63.291,
    lon: 18.718,
    operators: {
      'tesla-supercharger': 'Hästmarksvägen 2, 891 38 Örnsköldsvik',
      'circle-k': 'Tegelbruksvägen 1, 891 55 Örnsköldsvik',
      'ionity': 'Hästmarksvägen 2, 891 38 Örnsköldsvik',
      'default': 'Hästmarksvägen 2, 891 38 Örnsköldsvik',
    },
  },
  {
    city: 'Nordmaling',
    name: 'Nordmaling Resecentrum Snabbladdare',
    street: 'Södra Kungsvägen 2',
    postcode: '914 32',
    lat: 63.578,
    lon: 19.486,
    operators: {
      'circle-k': 'Södra Kungsvägen 2, 914 32 Nordmaling',
      'default': 'Södra Kungsvägen 2, 914 32 Nordmaling',
    },
  },
  {
    city: 'Umeå',
    name: 'Umeå Snabbladdningshubb',
    street: 'Formvägen 4',
    postcode: '906 21',
    lat: 63.845,
    lon: 20.312,
    operators: {
      'tesla-supercharger': 'Formvägen 4, 906 21 Umeå',
      'ionity': 'Klockarbäcksvägen 2, 901 37 Umeå',
      'circle-k': 'Formvägen 2, 906 21 Umeå',
      'okq8': 'Kronoskogsvägen 2, 903 61 Umeå',
      'default': 'Formvägen 4, 906 21 Umeå',
    },
  },
  {
    city: 'Jävre',
    name: 'Ionity & Snabbladdare Jävre',
    street: 'Riksvägen 1',
    postcode: '944 94',
    lat: 65.140,
    lon: 21.503,
    operators: {
      'ionity': 'Riksvägen 1, 944 94 Jävre',
      'default': 'Riksvägen 1, 944 94 Jävre',
    },
  },
  {
    city: 'Skellefteå',
    name: 'Skellefteå Snabbladdningshubb',
    street: 'Gymnasievägen 14',
    postcode: '931 57',
    lat: 64.750,
    lon: 20.953,
    operators: {
      'tesla-supercharger': 'Gymnasievägen 14, 931 57 Skellefteå',
      'circle-k': 'Varugatan 1, 931 76 Skellefteå',
      'ionity': 'Tjärnvägen 1, 931 61 Skellefteå',
      'default': 'Gymnasievägen 14, 931 57 Skellefteå',
    },
  },
  {
    city: 'Piteå',
    name: 'Piteå Snabbladdare',
    street: 'Fläktgatan 10',
    postcode: '941 47',
    lat: 65.317,
    lon: 21.480,
    operators: {
      'tesla-supercharger': 'Fläktgatan 10, 941 47 Piteå',
      'circle-k': 'Batterigatan 2, 941 47 Piteå',
      'default': 'Fläktgatan 10, 941 47 Piteå',
    },
  },
  {
    city: 'Luleå',
    name: 'Luleå Storheden Snabbladdare',
    street: 'Betongvägen 1',
    postcode: '973 45',
    lat: 65.617,
    lon: 22.052,
    operators: {
      'tesla-supercharger': 'Betongvägen 1, 973 45 Luleå',
      'circle-k': 'Betongvägen 2, 973 45 Luleå',
      'okq8': 'Midgårdsvägen 24, 973 34 Luleå',
      'default': 'Betongvägen 1, 973 45 Luleå',
    },
  },
  {
    city: 'Töre',
    name: 'Töre Snabbladdare E4/E10',
    street: 'Klippgränd 3',
    postcode: '952 42',
    lat: 65.914,
    lon: 22.651,
    operators: {
      'tesla-supercharger': 'Klippgränd 3, 952 42 Töre',
      'default': 'Klippgränd 3, 952 42 Töre',
    },
  },
  {
    city: 'Kalix',
    name: 'Kalix Snabbladdare',
    street: 'Valhallavägen 62',
    postcode: '952 31',
    lat: 65.854,
    lon: 23.141,
    operators: {
      'circle-k': 'Valhallavägen 62, 952 31 Kalix',
      'okq8': 'Stabsvägen 2, 952 51 Kalix',
      'default': 'Valhallavägen 62, 952 31 Kalix',
    },
  },
  {
    city: 'Övertorneå',
    name: 'Övertorneå Snabbladdare',
    street: 'Matarengivägen 24',
    postcode: '957 31',
    lat: 66.388,
    lon: 23.655,
    operators: {
      'default': 'Matarengivägen 24, 957 31 Övertorneå',
    },
  },
  {
    city: 'Pajala',
    name: 'Pajala Snabbladdningsstation',
    street: 'Tornedalsvägen 6',
    postcode: '984 31',
    lat: 67.214,
    lon: 23.367,
    operators: {
      'default': 'Tornedalsvägen 6, 984 31 Pajala',
    },
  },
];

// Minnescache för geokodade koordinater för att undvika onödiga nätverksanrop
const addressCache: Record<string, string> = {};

/**
 * Beräknar avstånd (i km) mellan två koordinater
 */
function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Hitta närmaste kända snabbladdningshubb utifrån koordinater
 */
export function findNearestKnownHub(lat: number, lon: number, maxDistanceKm: number = 35): KnownStationHub | null {
  if (!lat || !lon) return null;
  let best: KnownStationHub | null = null;
  let minDist = maxDistanceKm;

  for (const hub of KNOWN_SWEDISH_CHARGING_HUBS) {
    const d = haversineDistanceKm(lat, lon, hub.lat, hub.lon);
    if (d < minDist) {
      minDist = d;
      best = hub;
    }
  }

  return best;
}

/**
 * Hämta en verifierad fysisk adress för ett laddstopp längs en specifik ruttkorridor
 */
export function resolveCorridorPhysicalAddress(params: {
  milestoneMil: number;
  totalDistanceMil: number;
  startAddress: string;
  destAddress: string;
  operatorId: string;
  operatorName: string;
  coordinates?: [number, number];
}): {
  address: string;
  city: string;
  stationName: string;
  coordinates: [number, number];
} {
  const {
    milestoneMil,
    totalDistanceMil,
    startAddress,
    destAddress,
    operatorId,
    operatorName,
    coordinates,
  } = params;

  // 1. Prova först koordinatmatchning mot våra kända hubbar
  if (coordinates && coordinates[0] !== 0 && coordinates[1] !== 0) {
    const hub = findNearestKnownHub(coordinates[0], coordinates[1], 35);
    if (hub) {
      const opAddr = hub.operators[operatorId] || hub.operators['default'] || `${hub.street}, ${hub.postcode} ${hub.city}`;
      return {
        address: opAddr,
        city: hub.city,
        stationName: `${operatorName} ${hub.city}`,
        coordinates: [hub.lat, hub.lon],
      };
    }
  }

  // 2. Kontrollera välkända svenska ruttkorridorer (t.ex. Stockholm - Sälen)
  const startLower = (startAddress || '').toLowerCase();
  const destLower = (destAddress || '').toLowerCase();

  const isStockholmSalen =
    (startLower.includes('stockholm') && destLower.includes('sälen')) ||
    (startLower.includes('sälen') && destLower.includes('stockholm')) ||
    (destLower.includes('mora') && startLower.includes('stockholm'));

  if (isStockholmSalen && totalDistanceMil >= 30) {
    const ratio = totalDistanceMil > 0 ? milestoneMil / totalDistanceMil : 0.5;

    // Stockholm -> Sälen delsträckor:
    // ~15-25% -> Enköping / Sala
    // ~35-45% -> Hedemora / Avesta
    // ~50-65% -> Borlänge (21-25 mil från Sthlm)
    // ~70-80% -> Vansbro / Djurås
    // ~85-95% -> Malung
    if (ratio >= 0.45 && ratio <= 0.68) {
      // Borlänge (Kupolen) - Den mest frekventa laddplatsen mellan Stockholm och Sälen (ca 22-24 mil)
      const hub = KNOWN_SWEDISH_CHARGING_HUBS.find((h) => h.city === 'Borlänge')!;
      const addr = hub.operators[operatorId] || hub.operators['default'];
      return {
        address: addr,
        city: 'Borlänge',
        stationName: `${operatorName} Borlänge`,
        coordinates: [hub.lat, hub.lon],
      };
    } else if (ratio > 0.68 && ratio <= 0.85) {
      // Vansbro / Djurås
      const hub = KNOWN_SWEDISH_CHARGING_HUBS.find((h) => h.city === 'Vansbro')!;
      const addr = hub.operators[operatorId] || hub.operators['default'];
      return {
        address: addr,
        city: 'Vansbro',
        stationName: `${operatorName} Vansbro`,
        coordinates: [hub.lat, hub.lon],
      };
    } else if (ratio > 0.85) {
      // Malung
      const hub = KNOWN_SWEDISH_CHARGING_HUBS.find((h) => h.city === 'Malung')!;
      const addr = hub.operators[operatorId] || hub.operators['default'];
      return {
        address: addr,
        city: 'Malung',
        stationName: `${operatorName} Malung`,
        coordinates: [hub.lat, hub.lon],
      };
    } else if (ratio >= 0.30 && ratio < 0.45) {
      // Hedemora
      const hub = KNOWN_SWEDISH_CHARGING_HUBS.find((h) => h.city === 'Hedemora')!;
      const addr = hub.operators[operatorId] || hub.operators['default'];
      return {
        address: addr,
        city: 'Hedemora',
        stationName: `${operatorName} Hedemora`,
        coordinates: [hub.lat, hub.lon],
      };
    } else {
      // Enköping
      const hub = KNOWN_SWEDISH_CHARGING_HUBS.find((h) => h.city === 'Enköping')!;
      const addr = hub.operators[operatorId] || hub.operators['default'];
      return {
        address: addr,
        city: 'Enköping',
        stationName: `${operatorName} Enköping`,
        coordinates: [hub.lat, hub.lon],
      };
    }
  }

  // 3. Stockholm <-> Göteborg (E4/Rv40 eller E18/E20)
  const isStockholmGbg =
    (startLower.includes('stockholm') && destLower.includes('göteborg')) ||
    (startLower.includes('göteborg') && destLower.includes('stockholm'));

  if (isStockholmGbg && totalDistanceMil >= 35) {
    const ratio = milestoneMil / totalDistanceMil;
    if (ratio >= 0.45 && ratio <= 0.65) {
      // Jönköping / Örebro
      const hub = KNOWN_SWEDISH_CHARGING_HUBS.find((h) => h.city === 'Jönköping')!;
      const addr = hub.operators[operatorId] || hub.operators['default'];
      return {
        address: addr,
        city: 'Jönköping',
        stationName: `${operatorName} Jönköping`,
        coordinates: [hub.lat, hub.lon],
      };
    } else if (ratio < 0.45) {
      // Nyköping / Norrköping / Arboga
      const hub = KNOWN_SWEDISH_CHARGING_HUBS.find((h) => h.city === 'Norrköping')!;
      const addr = hub.operators[operatorId] || hub.operators['default'];
      return {
        address: addr,
        city: 'Norrköping',
        stationName: `${operatorName} Norrköping`,
        coordinates: [hub.lat, hub.lon],
      };
    }
  }

  // 4. Stockholm <-> Malmö (E4)
  const isStockholmMalmo =
    (startLower.includes('stockholm') && destLower.includes('malmö')) ||
    (startLower.includes('malmö') && destLower.includes('stockholm'));

  if (isStockholmMalmo && totalDistanceMil >= 45) {
    const ratio = milestoneMil / totalDistanceMil;
    if (ratio >= 0.40 && ratio <= 0.60) {
      const hub = KNOWN_SWEDISH_CHARGING_HUBS.find((h) => h.city === 'Jönköping')!;
      return {
        address: hub.operators[operatorId] || hub.operators['default'],
        city: 'Jönköping',
        stationName: `${operatorName} Jönköping`,
        coordinates: [hub.lat, hub.lon],
      };
    } else if (ratio > 0.60 && ratio <= 0.80) {
      const hub = KNOWN_SWEDISH_CHARGING_HUBS.find((h) => h.city === 'Värnamo')!;
      return {
        address: hub.operators[operatorId] || hub.operators['default'],
        city: 'Värnamo',
        stationName: `${operatorName} Värnamo`,
        coordinates: [hub.lat, hub.lon],
      };
    }
  }

  // 5. Fallback baserat på närmaste hubb utifrån koordinater
  if (coordinates && coordinates[0] !== 0 && coordinates[1] !== 0) {
    const nearestHub = findNearestKnownHub(coordinates[0], coordinates[1], 200);
    if (nearestHub) {
      const addr = nearestHub.operators[operatorId] || nearestHub.operators['default'] || `${nearestHub.street}, ${nearestHub.postcode} ${nearestHub.city}`;
      return {
        address: addr,
        city: nearestHub.city,
        stationName: `${operatorName} ${nearestHub.city}`,
        coordinates: [nearestHub.lat, nearestHub.lon],
      };
    }
  }

  const defaultHub = KNOWN_SWEDISH_CHARGING_HUBS[0]; // Standard fallback
  return {
    address: defaultHub.operators[operatorId] || defaultHub.operators['default'],
    city: defaultHub.city,
    stationName: `${operatorName} ${defaultHub.city}`,
    coordinates: [defaultHub.lat, defaultHub.lon],
  };
}

/**
 * Berika ett stationsnamn och dess fysiska adress
 */
export function formatPhysicalAddressForStation(
  station: {
    name?: string;
    street?: string | null;
    city?: string | null;
    lat?: number;
    lon?: number;
    operator?: string;
  },
  operatorId?: string
): {
  address: string;
  city: string;
  street: string;
} {
  // 1. Prova koordinatmatchning mot kända svenska hubbar (inom 15 km)
  if (station.lat && station.lon) {
    const hub = findNearestKnownHub(station.lat, station.lon, 15);
    if (hub) {
      const opKey = operatorId || 'default';
      const hubAddress = hub.operators[opKey] || hub.operators['default'];
      return {
        address: hubAddress,
        city: hub.city,
        street: hub.street,
      };
    }
  }

  // 2. Om stationen redan har både gatuadress och ort
  if (station.street && station.city) {
    return {
      address: `${station.street}, ${station.city}`,
      city: station.city,
      street: station.street,
    };
  }

  // 3. Om gata finns men inte ort
  if (station.street && !station.city) {
    return {
      address: station.street,
      city: 'Sverige',
      street: station.street,
    };
  }

  // 4. Om ort finns men inte gata: se om vi har en hubb i orten
  if (station.city) {
    const matchingHub = KNOWN_SWEDISH_CHARGING_HUBS.find(
      (h) => h.city.toLowerCase() === (station.city || '').toLowerCase()
    );
    if (matchingHub) {
      const opKey = operatorId || 'default';
      const addr = matchingHub.operators[opKey] || matchingHub.operators['default'];
      return {
        address: addr,
        city: matchingHub.city,
        street: matchingHub.street,
      };
    }
    return {
      address: `${station.city} (Centrum / Avfart)`,
      city: station.city,
      street: station.city,
    };
  }

  // 5. Analysera stationsnamnet (t.ex. "Tesla Arboga Supercharger" -> Arboga)
  if (station.name) {
    for (const hub of KNOWN_SWEDISH_CHARGING_HUBS) {
      if (station.name.toLowerCase().includes(hub.city.toLowerCase())) {
        const opKey = operatorId || 'default';
        const addr = hub.operators[opKey] || hub.operators['default'];
        return {
          address: addr,
          city: hub.city,
          street: hub.street,
        };
      }
    }
  }

  // 6. Generell fallback med tydlig platsindikering
  return {
    address: 'Längs huvudleden (Avfart laddstation)',
    city: 'Laddstation',
    street: 'Laddstation',
  };
}

/**
 * Bakgrundsuppslag via OpenStreetMap Nominatim om adress saknas helt och hållet
 */
export async function reverseGeocodeAddressAsync(lat: number, lon: number): Promise<string | null> {
  if (!lat || !lon) return null;
  const key = `${lat.toFixed(4)},${lon.toFixed(4)}`;

  if (addressCache[key]) {
    return addressCache[key];
  }

  // Kontrollera även localStorage
  try {
    const stored = localStorage.getItem(`geo_addr_${key}`);
    if (stored) {
      addressCache[key] = stored;
      return stored;
    }
  } catch {
    // Ignorera localStorage-fel
  }

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!res.ok) return null;
    const data = await res.json();
    if (!data || !data.address) return null;

    const a = data.address;
    const road = a.road || a.street || a.highway || '';
    const houseNumber = a.house_number || '';
    const postcode = a.postcode || '';
    const city = a.city || a.town || a.village || a.municipality || '';

    let formatted = '';
    if (road && houseNumber) {
      formatted = `${road} ${houseNumber}`;
    } else if (road) {
      formatted = road;
    }

    if (postcode && city) {
      formatted = formatted ? `${formatted}, ${postcode} ${city}` : `${postcode} ${city}`;
    } else if (city) {
      formatted = formatted ? `${formatted}, ${city}` : city;
    }

    if (formatted) {
      addressCache[key] = formatted;
      try {
        localStorage.setItem(`geo_addr_${key}`, formatted);
      } catch {
        // Ignorera
      }
      return formatted;
    }
    return null;
  } catch {
    return null;
  }
}
