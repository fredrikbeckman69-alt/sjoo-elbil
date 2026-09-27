/**
 * Databas över svenska orter, städer, kommuner och populära resmål
 * Ger 100% driftsäkerhet, 0 ms svarstid och 0 externa anrop för alla vanliga sökningar.
 */

export interface PredefinedPlace {
  name: string;
  aliases: string[];
  lat: number;
  lon: number;
  county: string;
}

export const SWEDISH_PREDEFINED_PLACES: PredefinedPlace[] = [
  // Norrland & Fjällvärlden
  { name: 'Pajala', aliases: ['pajala'], lat: 67.209036, lon: 23.364730, county: 'Norrbottens län' },
  { name: 'Kiruna', aliases: ['kiruna'], lat: 67.855722, lon: 20.225132, county: 'Norrbottens län' },
  { name: 'Gällivare', aliases: ['gallivare', 'gellivare'], lat: 67.133202, lon: 20.659613, county: 'Norrbottens län' },
  { name: 'Jokkmokk', aliases: ['jokkmokk'], lat: 66.606369, lon: 19.821915, county: 'Norrbottens län' },
  { name: 'Luleå', aliases: ['lulea', 'lule'], lat: 65.584819, lon: 22.156703, county: 'Norrbottens län' },
  { name: 'Boden', aliases: ['boden'], lat: 65.825150, lon: 21.688648, county: 'Norrbottens län' },
  { name: 'Piteå', aliases: ['pitea', 'pite'], lat: 65.317184, lon: 21.479439, county: 'Norrbottens län' },
  { name: 'Haparanda', aliases: ['haparanda'], lat: 65.835472, lon: 24.135252, county: 'Norrbottens län' },
  { name: 'Kalix', aliases: ['kalix'], lat: 65.853241, lon: 23.141527, county: 'Norrbottens län' },
  { name: 'Arvidsjaur', aliases: ['arvidsjaur'], lat: 65.590126, lon: 19.176495, county: 'Norrbottens län' },
  { name: 'Arjeplog', aliases: ['arjeplog'], lat: 65.814392, lon: 17.892975, county: 'Norrbottens län' },
  { name: 'Älvsbyn', aliases: ['alvsbyn'], lat: 65.674393, lon: 20.978252, county: 'Norrbottens län' },
  { name: 'Övertorneå', aliases: ['overtornea'], lat: 66.388832, lon: 23.655849, county: 'Norrbottens län' },
  { name: 'Överkalix', aliases: ['overkalix'], lat: 66.326859, lon: 22.846516, county: 'Norrbottens län' },

  // Västerbotten
  { name: 'Umeå', aliases: ['umea', 'ume'], lat: 63.825848, lon: 20.263035, county: 'Västerbottens län' },
  { name: 'Skellefteå', aliases: ['skelleftea', 'skellefte'], lat: 64.750669, lon: 20.952797, county: 'Västerbottens län' },
  { name: 'Lycksele', aliases: ['lycksele'], lat: 64.595467, lon: 18.673897, county: 'Västerbottens län' },
  { name: 'Storuman', aliases: ['storuman'], lat: 65.095818, lon: 17.115822, county: 'Västerbottens län' },
  { name: 'Vilhelmina', aliases: ['vilhelmina'], lat: 64.626892, lon: 16.655380, county: 'Västerbottens län' },
  { name: 'Dorotea', aliases: ['dorotea'], lat: 64.260582, lon: 16.411621, county: 'Västerbottens län' },
  { name: 'Tärnaby', aliases: ['tarnaby'], lat: 65.714851, lon: 15.067406, county: 'Västerbottens län' },
  { name: 'Hemavan', aliases: ['hemavan'], lat: 65.815254, lon: 15.084770, county: 'Västerbottens län' },
  { name: 'Vännäs', aliases: ['vannas'], lat: 63.908207, lon: 19.754715, county: 'Västerbottens län' },

  // Jämtland & Härjedalen
  { name: 'Östersund', aliases: ['ostersund'], lat: 63.179202, lon: 14.635662, county: 'Jämtlands län' },
  { name: 'Åre', aliases: ['are'], lat: 63.399048, lon: 13.081512, county: 'Jämtlands län' },
  { name: 'Vemdalen', aliases: ['vemdalen'], lat: 62.447556, lon: 13.856956, county: 'Jämtlands län' },
  { name: 'Sveg', aliases: ['sveg'], lat: 62.033623, lon: 14.364403, county: 'Jämtlands län' },
  { name: 'Funäsdalen', aliases: ['funasdalen'], lat: 62.544796, lon: 12.540192, county: 'Jämtlands län' },
  { name: 'Strömsund', aliases: ['stromsund'], lat: 63.852932, lon: 15.556213, county: 'Jämtlands län' },
  { name: 'Krokom', aliases: ['krokom'], lat: 63.327572, lon: 14.449764, county: 'Jämtlands län' },

  // Västernorrland
  { name: 'Sundsvall', aliases: ['sundsvall'], lat: 62.390811, lon: 17.306927, county: 'Västernorrlands län' },
  { name: 'Härnösand', aliases: ['harnosand'], lat: 62.632282, lon: 17.937941, county: 'Västernorrlands län' },
  { name: 'Örnsköldsvik', aliases: ['ornskoldsvik', 'ovik'], lat: 63.290913, lon: 18.715252, county: 'Västernorrlands län' },
  { name: 'Sollefteå', aliases: ['solleftea'], lat: 63.167812, lon: 17.274191, county: 'Västernorrlands län' },
  { name: 'Kramfors', aliases: ['kramfors'], lat: 62.895313, lon: 17.785233, county: 'Västernorrlands län' },
  { name: 'Ånge', aliases: ['ange'], lat: 62.524952, lon: 15.657516, county: 'Västernorrlands län' },

  // Gävleborg
  { name: 'Gävle', aliases: ['gavle'], lat: 60.674880, lon: 17.141273, county: 'Gävleborgs län' },
  { name: 'Sandviken', aliases: ['sandviken'], lat: 60.620602, lon: 16.775837, county: 'Gävleborgs län' },
  { name: 'Hudiksvall', aliases: ['hudiksvall', 'hudik'], lat: 61.729706, lon: 17.106514, county: 'Gävleborgs län' },
  { name: 'Bollnäs', aliases: ['bollnas'], lat: 61.348217, lon: 16.394625, county: 'Gävleborgs län' },
  { name: 'Söderhamn', aliases: ['soderhamn'], lat: 61.303967, lon: 17.058348, county: 'Gävleborgs län' },
  { name: 'Ljusdal', aliases: ['ljusdal'], lat: 61.829033, lon: 16.094593, county: 'Gävleborgs län' },

  // Dalarna
  { name: 'Falun', aliases: ['falun'], lat: 60.603570, lon: 15.625974, county: 'Dalarnas län' },
  { name: 'Borlänge', aliases: ['borlange'], lat: 60.485802, lon: 15.431221, county: 'Dalarnas län' },
  { name: 'Sälen', aliases: ['salen', 'lindvallen', 'tandadalen', 'hundfjallet'], lat: 61.155823, lon: 13.262527, county: 'Dalarnas län' },
  { name: 'Idre', aliases: ['idre', 'idrefjall'], lat: 61.859661, lon: 12.718872, county: 'Dalarnas län' },
  { name: 'Mora', aliases: ['mora'], lat: 61.004868, lon: 14.537029, county: 'Dalarnas län' },
  { name: 'Rättvik', aliases: ['rattvik'], lat: 60.884174, lon: 15.118608, county: 'Dalarnas län' },
  { name: 'Leksand', aliases: ['leksand'], lat: 60.730240, lon: 14.999641, county: 'Dalarnas län' },
  { name: 'Ludvika', aliases: ['ludvika'], lat: 60.149601, lon: 15.187834, county: 'Dalarnas län' },
  { name: 'Avesta', aliases: ['avesta'], lat: 60.146206, lon: 16.173872, county: 'Dalarnas län' },
  { name: 'Hedemora', aliases: ['hedemora'], lat: 60.278912, lon: 15.986345, county: 'Dalarnas län' },
  { name: 'Malung', aliases: ['malung'], lat: 60.683392, lon: 13.714571, county: 'Dalarnas län' },

  // Stockholm & Mälardalen
  { name: 'Stockholm', aliases: ['stockholm', 'sthlm', 't-centralen', 'stockholm c'], lat: 59.329323, lon: 18.068581, county: 'Stockholms län' },
  { name: 'Uppsala', aliases: ['uppsala'], lat: 59.858564, lon: 17.638927, county: 'Uppsala län' },
  { name: 'Västerås', aliases: ['vasteras'], lat: 59.609899, lon: 16.544809, county: 'Västmanlands län' },
  { name: 'Örebro', aliases: ['orebro'], lat: 59.275263, lon: 15.213411, county: 'Örebro län' },
  { name: 'Södertälje', aliases: ['sodertalje'], lat: 59.195538, lon: 17.625248, county: 'Stockholms län' },
  { name: 'Eskilstuna', aliases: ['eskilstuna'], lat: 59.370599, lon: 16.507702, county: 'Södermanlands län' },
  { name: 'Nyköping', aliases: ['nykoping', 'skavsta'], lat: 58.752842, lon: 17.009165, county: 'Södermanlands län' },
  { name: 'Norrtälje', aliases: ['norrtalje'], lat: 59.758011, lon: 18.705141, county: 'Stockholms län' },
  { name: 'Enköping', aliases: ['enkoping'], lat: 59.635677, lon: 17.077843, county: 'Uppsala län' },
  { name: 'Strängnäs', aliases: ['strangnas'], lat: 59.377399, lon: 17.031576, county: 'Södermanlands län' },
  { name: 'Katrineholm', aliases: ['katrineholm'], lat: 58.995834, lon: 16.206272, county: 'Södermanlands län' },
  { name: 'Köping', aliases: ['koping'], lat: 59.513687, lon: 15.992857, county: 'Västmanlands län' },
  { name: 'Arboga', aliases: ['arboga'], lat: 59.393433, lon: 15.842778, county: 'Västmanlands län' },
  { name: 'Sala', aliases: ['sala'], lat: 59.920803, lon: 16.606277, county: 'Västmanlands län' },
  { name: 'Fagersta', aliases: ['fagersta'], lat: 60.003983, lon: 15.792503, county: 'Västmanlands län' },
  { name: 'Karlskoga', aliases: ['karlskoga'], lat: 59.326374, lon: 14.523419, county: 'Örebro län' },
  { name: 'Kumla', aliases: ['kumla'], lat: 59.127602, lon: 15.143213, county: 'Örebro län' },
  { name: 'Hallsberg', aliases: ['hallsberg'], lat: 59.066494, lon: 15.111816, county: 'Örebro län' },
  { name: 'Askersund', aliases: ['askersund'], lat: 58.879780, lon: 14.901594, county: 'Örebro län' },

  // Värmland
  { name: 'Karlstad', aliases: ['karlstad'], lat: 59.402181, lon: 13.511498, county: 'Värmlands län' },
  { name: 'Kristinehamn', aliases: ['kristinehamn'], lat: 59.309837, lon: 14.108097, county: 'Värmlands län' },
  { name: 'Arvika', aliases: ['arvika'], lat: 59.654877, lon: 12.593712, county: 'Värmlands län' },
  { name: 'Säffle', aliases: ['saffle'], lat: 59.132801, lon: 12.927237, county: 'Värmlands län' },
  { name: 'Sunne', aliases: ['sunne'], lat: 59.837330, lon: 13.143942, county: 'Värmlands län' },
  { name: 'Torsby', aliases: ['torsby', 'branäs', 'branas'], lat: 60.138401, lon: 13.007671, county: 'Värmlands län' },
  { name: 'Åmål', aliases: ['amal'], lat: 59.052601, lon: 12.705141, county: 'Västra Götalands län' },

  // Västra Götaland
  { name: 'Göteborg', aliases: ['goteborg', 'gbg', 'gothenburg'], lat: 57.708870, lon: 11.974560, county: 'Västra Götalands län' },
  { name: 'Borås', aliases: ['boras'], lat: 57.721035, lon: 12.940113, county: 'Västra Götalands län' },
  { name: 'Trollhättan', aliases: ['trollhattan'], lat: 58.283653, lon: 12.285824, county: 'Västra Götalands län' },
  { name: 'Vänersborg', aliases: ['vanersborg'], lat: 58.380760, lon: 12.323532, county: 'Västra Götalands län' },
  { name: 'Skövde', aliases: ['skovde'], lat: 58.390278, lon: 13.845833, county: 'Västra Götalands län' },
  { name: 'Uddevalla', aliases: ['uddevalla'], lat: 58.349800, lon: 11.935600, county: 'Västra Götalands län' },
  { name: 'Alingsås', aliases: ['alingsas'], lat: 57.930038, lon: 12.533482, county: 'Västra Götalands län' },
  { name: 'Lidköping', aliases: ['lidkoping'], lat: 58.505169, lon: 13.157673, county: 'Västra Götalands län' },
  { name: 'Kungälv', aliases: ['kungalv'], lat: 57.873837, lon: 11.980998, county: 'Västra Götalands län' },
  { name: 'Mariestad', aliases: ['mariestad'], lat: 58.709972, lon: 13.823719, county: 'Västra Götalands län' },
  { name: 'Falköping', aliases: ['falkoping'], lat: 58.174828, lon: 13.553257, county: 'Västra Götalands län' },
  { name: 'Strömstad', aliases: ['stromstad'], lat: 58.937786, lon: 11.176434, county: 'Västra Götalands län' },
  { name: 'Lysekil', aliases: ['lysekil'], lat: 58.275810, lon: 11.435771, county: 'Västra Götalands län' },
  { name: 'Smögen', aliases: ['smogen'], lat: 58.355152, lon: 11.226997, county: 'Västra Götalands län' },
  { name: 'Ulricehamn', aliases: ['ulricehamn'], lat: 57.791538, lon: 13.414001, county: 'Västra Götalands län' },

  // Östergötland
  { name: 'Linköping', aliases: ['linkoping'], lat: 58.410807, lon: 15.621570, county: 'Östergötlands län' },
  { name: 'Norrköping', aliases: ['norrkoping'], lat: 58.587745, lon: 16.192421, county: 'Östergötlands län' },
  { name: 'Motala', aliases: ['motala'], lat: 58.537060, lon: 15.036491, county: 'Östergötlands län' },
  { name: 'Mjölby', aliases: ['mjolby'], lat: 58.324837, lon: 15.127869, county: 'Östergötlands län' },
  { name: 'Finspång', aliases: ['finspang'], lat: 58.709190, lon: 15.772591, county: 'Östergötlands län' },
  { name: 'Söderköping', aliases: ['soderkoping'], lat: 58.481232, lon: 16.321453, county: 'Östergötlands län' },
  { name: 'Vadstena', aliases: ['vadstena'], lat: 58.448559, lon: 14.889312, county: 'Östergötlands län' },
  { name: 'Åtvidaberg', aliases: ['atvidaberg'], lat: 58.200157, lon: 15.998492, county: 'Östergötlands län' },

  // Jönköping & Småland
  { name: 'Jönköping', aliases: ['jonkoping', 'huskvarna'], lat: 57.782614, lon: 14.161788, county: 'Jönköpings län' },
  { name: 'Gränna', aliases: ['granna'], lat: 58.024441, lon: 14.464626, county: 'Jönköpings län' },
  { name: 'Värnamo', aliases: ['varnamo'], lat: 57.185699, lon: 14.041691, county: 'Jönköpings län' },
  { name: 'Nässjö', aliases: ['nassjo'], lat: 57.653450, lon: 14.697521, county: 'Jönköpings län' },
  { name: 'Tranås', aliases: ['tranas'], lat: 58.037148, lon: 14.978252, county: 'Jönköpings län' },
  { name: 'Vetlanda', aliases: ['vetlanda'], lat: 57.427734, lon: 15.086304, county: 'Jönköpings län' },
  { name: 'Eksjö', aliases: ['eksjo'], lat: 57.667252, lon: 14.971203, county: 'Jönköpings län' },
  { name: 'Gislaved', aliases: ['gislaved'], lat: 57.304092, lon: 13.541786, county: 'Jönköpings län' },

  // Kronoberg
  { name: 'Växjö', aliases: ['vaxjo'], lat: 56.877673, lon: 14.809064, county: 'Kronobergs län' },
  { name: 'Ljungby', aliases: ['ljungby'], lat: 56.834419, lon: 13.940563, county: 'Kronobergs län' },
  { name: 'Älmhult', aliases: ['almhult'], lat: 56.551369, lon: 14.138451, county: 'Kronobergs län' },
  { name: 'Alvesta', aliases: ['alvesta'], lat: 56.899689, lon: 14.555778, county: 'Kronobergs län' },

  // Kalmar & Öland
  { name: 'Kalmar', aliases: ['kalmar'], lat: 56.663445, lon: 16.356779, county: 'Kalmar län' },
  { name: 'Västervik', aliases: ['vastervik'], lat: 57.757751, lon: 16.637081, county: 'Kalmar län' },
  { name: 'Oskarshamn', aliases: ['oskarshamn'], lat: 57.264496, lon: 16.447548, county: 'Kalmar län' },
  { name: 'Nybro', aliases: ['nybro'], lat: 56.744381, lon: 15.907314, county: 'Kalmar län' },
  { name: 'Vimmerby', aliases: ['vimmerby'], lat: 57.665482, lon: 15.855231, county: 'Kalmar län' },
  { name: 'Borgholm', aliases: ['borgholm', 'öland', 'oland'], lat: 56.878952, lon: 16.656097, county: 'Kalmar län' },

  // Gotland
  { name: 'Visby', aliases: ['visby', 'gotland'], lat: 57.634800, lon: 18.294840, county: 'Gotlands län' },

  // Halland
  { name: 'Halmstad', aliases: ['halmstad'], lat: 56.674463, lon: 12.857782, county: 'Hallands län' },
  { name: 'Varberg', aliases: ['varberg'], lat: 57.107052, lon: 12.252277, county: 'Hallands län' },
  { name: 'Kungsbacka', aliases: ['kungsbacka'], lat: 57.487827, lon: 12.076046, county: 'Hallands län' },
  { name: 'Falkenberg', aliases: ['falkenberg'], lat: 56.905628, lon: 12.491380, county: 'Hallands län' },
  { name: 'Laholm', aliases: ['laholm'], lat: 56.512604, lon: 13.043321, county: 'Hallands län' },

  // Blekinge
  { name: 'Karlskrona', aliases: ['karlskrona'], lat: 56.161224, lon: 15.586900, county: 'Blekinge län' },
  { name: 'Karlshamn', aliases: ['karlshamn'], lat: 56.170612, lon: 14.862447, county: 'Blekinge län' },
  { name: 'Ronneby', aliases: ['ronneby'], lat: 56.210629, lon: 15.276251, county: 'Blekinge län' },
  { name: 'Sölvesborg', aliases: ['solvesborg'], lat: 56.050510, lon: 14.586616, county: 'Blekinge län' },

  // Skåne
  { name: 'Malmö', aliases: ['malmo', 'malmö'], lat: 55.605293, lon: 13.000157, county: 'Skåne län' },
  { name: 'Helsingborg', aliases: ['helsingborg', 'hbg'], lat: 56.046467, lon: 12.694512, county: 'Skåne län' },
  { name: 'Lund', aliases: ['lund'], lat: 55.704660, lon: 13.191007, county: 'Skåne län' },
  { name: 'Kristianstad', aliases: ['kristianstad'], lat: 56.029394, lon: 14.156678, county: 'Skåne län' },
  { name: 'Landskrona', aliases: ['landskrona'], lat: 55.870342, lon: 12.830058, county: 'Skåne län' },
  { name: 'Trelleborg', aliases: ['trelleborg'], lat: 55.375839, lon: 13.156944, county: 'Skåne län' },
  { name: 'Ängelholm', aliases: ['angelholm'], lat: 56.242779, lon: 12.862211, county: 'Skåne län' },
  { name: 'Hässleholm', aliases: ['hassleholm'], lat: 56.158871, lon: 13.766804, county: 'Skåne län' },
  { name: 'Ystad', aliases: ['ystad'], lat: 55.429512, lon: 13.820031, county: 'Skåne län' },
  { name: 'Eslöv', aliases: ['eslov'], lat: 55.838562, lon: 13.303862, county: 'Skåne län' },
  { name: 'Höganäs', aliases: ['hoganas'], lat: 56.199696, lon: 12.556730, county: 'Skåne län' },
  { name: 'Båstad', aliases: ['bastad'], lat: 56.433292, lon: 12.854371, county: 'Skåne län' },
  { name: 'Simrishamn', aliases: ['simrishamn', 'österlen', 'osterlen'], lat: 55.556213, lon: 14.350819, county: 'Skåne län' },
  { name: 'Sjöbo', aliases: ['sjobo'], lat: 55.633881, lon: 13.704671, county: 'Skåne län' },
  { name: 'Tomelilla', aliases: ['tomelilla'], lat: 55.548489, lon: 13.954751, county: 'Skåne län' },
  { name: 'Åhus', aliases: ['ahus'], lat: 55.925526, lon: 14.293318, county: 'Skåne län' },
  { name: 'Kävlinge', aliases: ['kavlinge'], lat: 55.792500, lon: 13.111944, county: 'Skåne län' },
  { name: 'Lomma', aliases: ['lomma'], lat: 55.673889, lon: 13.069444, county: 'Skåne län' },
  { name: 'Staffanstorp', aliases: ['staffanstorp'], lat: 55.642500, lon: 13.208889, county: 'Skåne län' },
  { name: 'Svedala', aliases: ['svedala'], lat: 55.510833, lon: 13.235556, county: 'Skåne län' },
  { name: 'Vellinge', aliases: ['vellinge', 'skanör', 'falsterbo'], lat: 55.470833, lon: 13.020833, county: 'Skåne län' },
];

/**
 * Normaliserar text för flexibel ortsmatchning (gemener, utan å/ä/ö, rensar skiljetecken)
 */
export function normalizePlaceQuery(query: string): string {
  return query
    .trim()
    .toLowerCase()
    .replace(/å/g, 'a')
    .replace(/ä/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/é/g, 'e')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Söker i den lokala ortsdatabasen efter direkt matchning.
 * Returnerar plats direkt med 0 ms latens om träff finns.
 */
export function findPredefinedPlace(query: string): PredefinedPlace | null {
  const norm = normalizePlaceQuery(query);
  if (!norm) return null;

  // 1. Exakt matchning mot namn eller alias
  const exact = SWEDISH_PREDEFINED_PLACES.find((p) => {
    if (normalizePlaceQuery(p.name) === norm) return true;
    return p.aliases.some((a) => normalizePlaceQuery(a) === norm);
  });
  if (exact) return exact;

  // 2. Prefix / Innehåller-matchning om sökningen är minst 3 tecken
  if (norm.length >= 3) {
    const partial = SWEDISH_PREDEFINED_PLACES.find((p) => {
      const pNorm = normalizePlaceQuery(p.name);
      return pNorm.startsWith(norm) || norm.startsWith(pNorm);
    });
    if (partial) return partial;
  }

  return null;
}
