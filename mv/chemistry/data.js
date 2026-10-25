/* 元素之歌 · 数据层
 * 真实数据：原子量取 IUPAC/CIAAW 2021 常用值；发现年份取史学通行说法（古代元素为约数）。
 * 谱线波长取 NIST Atomic Spectra Database（空气波长，nm）。
 * 胰岛素序列取 UniProt P01308（A 链 21 + B 链 30 = 51 个氨基酸）。
 * 每一项在片尾与《素材与数据出处.md》里可追溯。
 */
'use strict';

// [Z, symbol, 中文名, English, atomic mass, discovery year, category]
const ELEM_RAW = [
  [1,'H','氢','Hydrogen',1.008,1766,'nonmetal'],
  [2,'He','氦','Helium',4.002602,1868,'noble'],
  [3,'Li','锂','Lithium',6.94,1817,'alkali'],
  [4,'Be','铍','Beryllium',9.0121831,1798,'alkaline'],
  [5,'B','硼','Boron',10.81,1808,'metalloid'],
  [6,'C','碳','Carbon',12.011,-3750,'nonmetal'],
  [7,'N','氮','Nitrogen',14.007,1772,'nonmetal'],
  [8,'O','氧','Oxygen',15.999,1774,'nonmetal'],
  [9,'F','氟','Fluorine',18.998403163,1886,'halogen'],
  [10,'Ne','氖','Neon',20.1797,1898,'noble'],
  [11,'Na','钠','Sodium',22.98976928,1807,'alkali'],
  [12,'Mg','镁','Magnesium',24.305,1755,'alkaline'],
  [13,'Al','铝','Aluminium',26.9815385,1825,'post'],
  [14,'Si','硅','Silicon',28.085,1824,'metalloid'],
  [15,'P','磷','Phosphorus',30.973761998,1669,'nonmetal'],
  [16,'S','硫','Sulfur',32.06,-2000,'nonmetal'],
  [17,'Cl','氯','Chlorine',35.45,1774,'halogen'],
  [18,'Ar','氩','Argon',39.948,1894,'noble'],
  [19,'K','钾','Potassium',39.0983,1807,'alkali'],
  [20,'Ca','钙','Calcium',40.078,1808,'alkaline'],
  [21,'Sc','钪','Scandium',44.955908,1879,'transition'],
  [22,'Ti','钛','Titanium',47.867,1791,'transition'],
  [23,'V','钒','Vanadium',50.9415,1801,'transition'],
  [24,'Cr','铬','Chromium',51.9961,1797,'transition'],
  [25,'Mn','锰','Manganese',54.938044,1774,'transition'],
  [26,'Fe','铁','Iron',55.845,-3000,'transition'],
  [27,'Co','钴','Cobalt',58.933194,1735,'transition'],
  [28,'Ni','镍','Nickel',58.6934,1751,'transition'],
  [29,'Cu','铜','Copper',63.546,-5000,'transition'],
  [30,'Zn','锌','Zinc',65.38,-1000,'transition'],
  [31,'Ga','镓','Gallium',69.723,1875,'post'],
  [32,'Ge','锗','Germanium',72.63,1886,'metalloid'],
  [33,'As','砷','Arsenic',74.921595,1250,'metalloid'],
  [34,'Se','硒','Selenium',78.971,1817,'nonmetal'],
  [35,'Br','溴','Bromine',79.904,1826,'halogen'],
  [36,'Kr','氪','Krypton',83.798,1898,'noble'],
  [37,'Rb','铷','Rubidium',85.4678,1861,'alkali'],
  [38,'Sr','锶','Strontium',87.62,1790,'alkaline'],
  [39,'Y','钇','Yttrium',88.90584,1794,'transition'],
  [40,'Zr','锆','Zirconium',91.224,1789,'transition'],
  [41,'Nb','铌','Niobium',92.90637,1801,'transition'],
  [42,'Mo','钼','Molybdenum',95.95,1778,'transition'],
  [43,'Tc','锝','Technetium',98,1937,'transition'],
  [44,'Ru','钌','Ruthenium',101.07,1844,'transition'],
  [45,'Rh','铑','Rhodium',102.9055,1803,'transition'],
  [46,'Pd','钯','Palladium',106.42,1803,'transition'],
  [47,'Ag','银','Silver',107.8682,-3000,'transition'],
  [48,'Cd','镉','Cadmium',112.414,1817,'transition'],
  [49,'In','铟','Indium',114.818,1863,'post'],
  [50,'Sn','锡','Tin',118.71,-3500,'post'],
  [51,'Sb','锑','Antimony',121.76,-3000,'metalloid'],
  [52,'Te','碲','Tellurium',127.6,1782,'metalloid'],
  [53,'I','碘','Iodine',126.90447,1811,'halogen'],
  [54,'Xe','氙','Xenon',131.293,1898,'noble'],
  [55,'Cs','铯','Caesium',132.90545196,1860,'alkali'],
  [56,'Ba','钡','Barium',137.327,1808,'alkaline'],
  [57,'La','镧','Lanthanum',138.90547,1839,'lanthanide'],
  [58,'Ce','铈','Cerium',140.116,1803,'lanthanide'],
  [59,'Pr','镨','Praseodymium',140.90766,1885,'lanthanide'],
  [60,'Nd','钕','Neodymium',144.242,1885,'lanthanide'],
  [61,'Pm','钷','Promethium',145,1945,'lanthanide'],
  [62,'Sm','钐','Samarium',150.36,1879,'lanthanide'],
  [63,'Eu','铕','Europium',151.964,1901,'lanthanide'],
  [64,'Gd','钆','Gadolinium',157.25,1880,'lanthanide'],
  [65,'Tb','铽','Terbium',158.92535,1843,'lanthanide'],
  [66,'Dy','镝','Dysprosium',162.5,1886,'lanthanide'],
  [67,'Ho','钬','Holmium',164.93033,1878,'lanthanide'],
  [68,'Er','铒','Erbium',167.259,1843,'lanthanide'],
  [69,'Tm','铥','Thulium',168.93422,1879,'lanthanide'],
  [70,'Yb','镱','Ytterbium',173.045,1878,'lanthanide'],
  [71,'Lu','镥','Lutetium',174.9668,1907,'lanthanide'],
  [72,'Hf','铪','Hafnium',178.49,1923,'transition'],
  [73,'Ta','钽','Tantalum',180.94788,1802,'transition'],
  [74,'W','钨','Tungsten',183.84,1783,'transition'],
  [75,'Re','铼','Rhenium',186.207,1925,'transition'],
  [76,'Os','锇','Osmium',190.23,1803,'transition'],
  [77,'Ir','铱','Iridium',192.217,1803,'transition'],
  [78,'Pt','铂','Platinum',195.084,1735,'transition'],
  [79,'Au','金','Gold',196.966569,-6000,'transition'],
  [80,'Hg','汞','Mercury',200.592,-2000,'transition'],
  [81,'Tl','铊','Thallium',204.38,1861,'post'],
  [82,'Pb','铅','Lead',207.2,-7000,'post'],
  [83,'Bi','铋','Bismuth',208.9804,1400,'post'],
  [84,'Po','钋','Polonium',209,1898,'post'],
  [85,'At','砹','Astatine',210,1940,'halogen'],
  [86,'Rn','氡','Radon',222,1900,'noble'],
  [87,'Fr','钫','Francium',223,1939,'alkali'],
  [88,'Ra','镭','Radium',226,1898,'alkaline'],
  [89,'Ac','锕','Actinium',227,1899,'actinide'],
  [90,'Th','钍','Thorium',232.0377,1829,'actinide'],
  [91,'Pa','镤','Protactinium',231.03588,1913,'actinide'],
  [92,'U','铀','Uranium',238.02891,1789,'actinide'],
  [93,'Np','镎','Neptunium',237,1940,'actinide'],
  [94,'Pu','钚','Plutonium',244,1940,'actinide'],
  [95,'Am','镅','Americium',243,1944,'actinide'],
  [96,'Cm','锔','Curium',247,1944,'actinide'],
  [97,'Bk','锫','Berkelium',247,1949,'actinide'],
  [98,'Cf','锎','Californium',251,1950,'actinide'],
  [99,'Es','锿','Einsteinium',252,1952,'actinide'],
  [100,'Fm','镄','Fermium',257,1952,'actinide'],
  [101,'Md','钔','Mendelevium',258,1955,'actinide'],
  [102,'No','锘','Nobelium',259,1966,'actinide'],
  [103,'Lr','铹','Lawrencium',266,1961,'actinide'],
  [104,'Rf','𬬻','Rutherfordium',267,1964,'transition'],
  [105,'Db','𬭊','Dubnium',268,1967,'transition'],
  [106,'Sg','𬭳','Seaborgium',269,1974,'transition'],
  [107,'Bh','𬭛','Bohrium',270,1981,'transition'],
  [108,'Hs','𬭶','Hassium',269,1984,'transition'],
  [109,'Mt','鿏','Meitnerium',278,1982,'unknown'],
  [110,'Ds','𨭎','Darmstadtium',281,1994,'unknown'],
  [111,'Rg','𬬭','Roentgenium',282,1994,'unknown'],
  [112,'Cn','鿔','Copernicium',285,1996,'transition'],
  [113,'Nh','鿭','Nihonium',286,2004,'post'],
  [114,'Fl','𫓧','Flerovium',289,1999,'post'],
  [115,'Mc','镆','Moscovium',290,2003,'post'],
  [116,'Lv','𫟼','Livermorium',293,2000,'post'],
  [117,'Ts','鿬','Tennessine',294,2010,'halogen'],
  [118,'Og','鿫','Oganesson',294,2002,'noble'],
];

const CAT_COLOR = {
  alkali: '#e8a05a', alkaline: '#d9b45e', transition: '#7fc6d8', post: '#8fb8c8',
  metalloid: '#a6c47e', nonmetal: '#d8d2bf', halogen: '#9fd6c0', noble: '#b49ad8',
  lanthanide: '#cba8d8', actinide: '#d89a9a', unknown: '#8a8f98',
};

const ELEM = ELEM_RAW.map(e => ({
  z: e[0], sym: e[1], cn: e[2], en: e[3], mass: e[4], year: e[5], cat: e[6],
}));
const BY_SYM = {};
const BY_Z = {};
for (const e of ELEM) { BY_SYM[e.sym] = e; BY_Z[e.z] = e; }

// 周期表布局（18 列 × 7 行；镧系/锕系另起两行）
const TABLE_LAYOUT = (() => {
  const pos = {};
  const main = [
    ['H', 1, 1], ['He', 1, 18],
    ['Li', 2, 1], ['Be', 2, 2], ['B', 2, 13], ['C', 2, 14], ['N', 2, 15], ['O', 2, 16], ['F', 2, 17], ['Ne', 2, 18],
    ['Na', 3, 1], ['Mg', 3, 2], ['Al', 3, 13], ['Si', 3, 14], ['P', 3, 15], ['S', 3, 16], ['Cl', 3, 17], ['Ar', 3, 18],
    ['K', 4, 1], ['Ca', 4, 2], ['Sc', 4, 3], ['Ti', 4, 4], ['V', 4, 5], ['Cr', 4, 6], ['Mn', 4, 7], ['Fe', 4, 8],
    ['Co', 4, 9], ['Ni', 4, 10], ['Cu', 4, 11], ['Zn', 4, 12], ['Ga', 4, 13], ['Ge', 4, 14], ['As', 4, 15],
    ['Se', 4, 16], ['Br', 4, 17], ['Kr', 4, 18],
    ['Rb', 5, 1], ['Sr', 5, 2], ['Y', 5, 3], ['Zr', 5, 4], ['Nb', 5, 5], ['Mo', 5, 6], ['Tc', 5, 7], ['Ru', 5, 8],
    ['Rh', 5, 9], ['Pd', 5, 10], ['Ag', 5, 11], ['Cd', 5, 12], ['In', 5, 13], ['Sn', 5, 14], ['Sb', 5, 15],
    ['Te', 5, 16], ['I', 5, 17], ['Xe', 5, 18],
    ['Cs', 6, 1], ['Ba', 6, 2], ['Hf', 6, 4], ['Ta', 6, 5], ['W', 6, 6], ['Re', 6, 7], ['Os', 6, 8], ['Ir', 6, 9],
    ['Pt', 6, 10], ['Au', 6, 11], ['Hg', 6, 12], ['Tl', 6, 13], ['Pb', 6, 14], ['Bi', 6, 15], ['Po', 6, 16],
    ['At', 6, 17], ['Rn', 6, 18],
    ['Fr', 7, 1], ['Ra', 7, 2], ['Rf', 7, 4], ['Db', 7, 5], ['Sg', 7, 6], ['Bh', 7, 7], ['Hs', 7, 8], ['Mt', 7, 9],
    ['Ds', 7, 10], ['Rg', 7, 11], ['Cn', 7, 12], ['Nh', 7, 13], ['Fl', 7, 14], ['Mc', 7, 15], ['Lv', 7, 16],
    ['Ts', 7, 17], ['Og', 7, 18],
  ];
  for (const [s, r, c] of main) pos[s] = { row: r, col: c };
  for (let i = 0; i < 15; i++) {
    pos[ELEM[56 + i].sym] = { row: 9, col: 3 + i };   // La..Lu
    pos[ELEM[88 + i].sym] = { row: 10, col: 3 + i };  // Ac..Lr
  }
  return pos;
})();

// 某一历史年份已知的元素个数（按发现年份；古代元素为约数）
function knownByYear(y) {
  let n = 0;
  for (const e of ELEM) if (e.year <= y) n++;
  return n;
}

// NIST ASD 空气波长（nm）。强度仅用于画面宽度，不影响位置。
const SPECTRA = {
  H:  { name: '氢',   lines: [[656.28, 1.0], [486.13, 0.75], [434.05, 0.55], [410.17, 0.42], [397.01, 0.3]] },
  He: { name: '氦',   lines: [[667.82, 0.5], [587.56, 1.0], [501.57, 0.5], [492.19, 0.55], [471.31, 0.5], [447.15, 0.6], [402.62, 0.35]] },
  Na: { name: '钠',   lines: [[589.00, 1.0], [589.59, 1.0], [568.8, 0.2], [615.4, 0.15]] },
  K:  { name: '钾',   lines: [[766.49, 1.0], [769.90, 0.9], [404.41, 0.3]] },
  Li: { name: '锂',   lines: [[670.78, 1.0], [610.36, 0.25], [460.29, 0.2]] },
  Ca: { name: '钙',   lines: [[422.67, 1.0], [393.37, 0.9], [396.85, 0.5], [616.2, 0.25]] },
  Cu: { name: '铜',   lines: [[510.55, 1.0], [515.32, 0.9], [521.82, 0.85]] },
  Hg: { name: '汞',   lines: [[404.66, 0.4], [435.83, 0.8], [546.07, 1.0], [576.96, 0.7], [579.07, 0.7]] },
  Fe: { name: '铁',   lines: [[438.35, 0.7], [489.08, 0.5], [495.76, 0.4], [516.75, 0.5], [526.95, 0.6], [532.80, 0.5], [537.15, 0.6]] },
  Ne: { name: '氖',   lines: [[585.25, 1.0], [588.19, 0.9], [594.48, 0.8], [603.00, 0.5], [614.31, 0.8], [640.22, 0.7], [650.65, 0.6]] },
  Ar: { name: '氩',   lines: [[696.54, 0.6], [706.72, 0.8], [738.40, 0.7], [750.39, 0.5], [763.51, 0.6]] },
  N:  { name: '氮',   lines: [[746.83, 0.5]] },
};

// 波长 → 可见光颜色（近似 CIE 单色光，含亮度权重）
function wavelengthRGB(nm) {
  let r = 0, g = 0, b = 0;
  if (nm < 380 || nm > 780) return [40, 40, 46];
  if (nm < 440) { r = -(nm - 440) / 60; b = 1; }
  else if (nm < 490) { g = (nm - 440) / 50; b = 1; }
  else if (nm < 510) { g = 1; b = -(nm - 510) / 20; }
  else if (nm < 580) { r = (nm - 510) / 70; g = 1; }
  else if (nm < 645) { r = 1; g = -(nm - 645) / 65; }
  else { r = 1; }
  let f = 1;
  if (nm < 420) f = 0.35 + 0.65 * (nm - 380) / 40;
  else if (nm > 700) f = 0.35 + 0.65 * (780 - nm) / 80;
  const gam = v => Math.round(255 * Math.pow(Math.max(0, v) * f, 0.8));
  return [gam(r), gam(g), gam(b)];
}

// 真实时间轴：歌词/画面/年份/图号
const LINES = [
  { t: 0.00,  cn: '', en: '', year: -400000, fig: '000', tag: 'PROLOGUE', scene: 'lattice' },
  { t: 8.00,  cn: '', en: '', year: -400000, fig: '001', tag: 'ONE TABLE', scene: 'intro' },
  { t: 16.00, cn: '我们在黑暗里找到了火', en: 'We found the fire in the dark', year: -400000, fig: '002', tag: 'FIRE', scene: 'fire' },
  { t: 20.00, cn: '我们铸出青铜，让它鸣响', en: 'We cast the bronze and made it ring', year: -3000, fig: '006', tag: 'BRONZE', scene: 'bronze' },
  { t: 23.00, cn: '一座古老的丹炉，藏着秘密的火星', en: 'An old stove hid a secret spark', year: 850, fig: '014', tag: 'ALCHEMY', scene: 'alchemy' },
  { t: 26.00, cn: '黑色的火药，乘风飞扬', en: 'Black powder flying on the wind', year: 1044, fig: '018', tag: 'POWDER', scene: 'powder' },
  { t: 30.00, cn: '布兰德守着一口锅，熬了一整夜', en: 'Brand boiled a pot all night', year: 1669, fig: '023', tag: 'PHOSPHORUS', scene: 'brand' },
  { t: 34.00, cn: '锅里有样东西，竟然发出了光', en: 'And something in it gave off light', year: 1669, fig: '024', tag: 'GLOW', scene: 'glow' },
  { t: 37.00, cn: '别急着相信，再做一次实验', en: "Don't believe it, test it again", year: 1774, fig: '031', tag: 'REPLICATE', scene: 'replicate' },
  { t: 44.00, cn: '看它变化，看它变化', en: 'Watch it change, watch it change', year: 1789, fig: '038', tag: 'CHORUS · CHANGE', scene: 'change1' },
  { t: 48.00, cn: '每一种颜色，都有它的名字', en: 'Every color has a name', year: 1766, fig: '042', tag: 'COLOR', scene: 'color' },
  { t: 52.00, cn: '不会凭空消失，也不会凭空多出', en: 'Nothing lost and nothing gained', year: 1789, fig: '046', tag: 'MASS', scene: 'mass' },
  { t: 56.00, cn: '看它变化，看它变化', en: 'Watch it change, watch it change', year: 1789, fig: '050', tag: 'CHORUS · CHANGE', scene: 'change2' },
  { t: 58.00, cn: '看它变化，看它变化', en: 'Watch it change, watch it change', year: 1855, fig: '052', tag: 'CHORUS · CHANGE', scene: 'change3' },
  { t: 60.20, cn: '', en: '', year: 1859, fig: '056', tag: 'INTERLUDE · LIGHT', scene: 'inter1' },
  { t: 69.50, cn: '', en: '', year: 1807, fig: '062', tag: 'INTERLUDE · CURRENT', scene: 'davy' },
  { t: 76.00, cn: '', en: '', year: 1828, fig: '067', tag: 'INTERLUDE · UREA', scene: 'wohler' },
  { t: 85.50, cn: '光穿过玻璃，碎成一道道谱线', en: 'Light through glass breaks into lines', year: 1859, fig: '071', tag: 'SPECTRUM', scene: 'prism' },
  { t: 90.00, cn: '每一条线，都是一种元素的记号', en: 'Every line a kind of sign', year: 1859, fig: '073', tag: 'LINES', scene: 'lines' },
  { t: 92.75, cn: '先在太阳里找到，后来才在地上找到', en: 'Found in the sun before the ground', year: 1868, fig: '076', tag: 'HELIUM', scene: 'helium' },
  { t: 96.25, cn: '梦里一条蛇，首尾相衔转成环', en: 'A snake in a dream came round and round', year: 1865, fig: '080', tag: 'BENZENE', scene: 'benzene' },
  { t: 99.75, cn: '门捷列夫在表里，留下了空格', en: 'Mendeleev left an empty space', year: 1869, fig: '084', tag: 'THE GAP', scene: 'mendeleev' },
  { t: 102.00, cn: '后来世界真的回来，把空格一一填满', en: 'And the world came back to fill the place', year: 1871, fig: '087', tag: 'FILLED', scene: 'filled' },
  { t: 106.00, cn: '给每一种元素，起一个留得住的名字', en: 'Give each one a name to keep', year: 1871, fig: '091', tag: 'NAMING', scene: 'naming' },
  { t: 113.25, cn: '看它变化，看它变化', en: 'Watch it change, watch it change', year: 1896, fig: '095', tag: 'CHORUS · CHANGE', scene: 'change4' },
  { t: 116.00, cn: '烧出红色，烧出绿色', en: 'Burn it red and burn it green', year: 1860, fig: '098', tag: 'FLAME', scene: 'flame' },
  { t: 120.00, cn: '寒冷的旧棚屋里，幽幽的微光', en: 'Glowing faint in a cold old shed', year: 1898, fig: '102', tag: 'RADIUM', scene: 'radium' },
  { t: 124.00, cn: '从空气里造出面包，喂饱更多的人', en: 'Bread from the air, the world is fed', year: 1913, fig: '106', tag: 'NITROGEN', scene: 'haber' },
  { t: 130.00, cn: '', en: '', year: 1916, fig: '110', tag: 'INTERLUDE · BONDS', scene: 'inter2' },
  { t: 136.00, cn: '', en: '', year: 1926, fig: '114', tag: 'INTERLUDE · ATOM', scene: 'inter3' },
  { t: 142.50, cn: '两个小点，就能连成一个化学键', en: 'Two small dots can hold a bond', year: 1916, fig: '118', tag: 'BOND', scene: 'bond' },
  { t: 146.00, cn: '电子不是小球，是一团概率的云', en: 'Not a ball, a cloud of chance', year: 1926, fig: '122', tag: 'ORBITAL', scene: 'orbital' },
  { t: 150.50, cn: '一个 X 形的衍射，变成螺旋的阶梯', en: 'An X of light became a stair', year: 1952, fig: '126', tag: 'DNA', scene: 'dna' },
  { t: 153.00, cn: '五十一个氨基酸，一个接一个连起来', en: 'Fifty-one, linked one by one', year: 1965, fig: '129', tag: 'INSULIN', scene: 'insulin' },
  { t: 156.00, cn: '她翻开一本很久以前的古书', en: 'She read a book from long ago', year: 1969, fig: '133', tag: 'THE BOOK', scene: 'book' },
  { t: 160.00, cn: '不用火煮，要低温', en: 'Not with fire, keep it cold', year: 1971, fig: '136', tag: 'COLD', scene: 'cold' },
  { t: 162.00, cn: '第 191 号样品，一次安静的尝试', en: 'Bottle one nine one, a quiet try', year: 1971, fig: '137', tag: 'SAMPLE 191', scene: 'sample191' },
  { t: 166.00, cn: '更多的人，因此活了下来', en: 'And many more were still alive', year: 1972, fig: '141', tag: 'MALARIA', scene: 'malaria' },
  { t: 173.50, cn: '看它变化，看它变化', en: 'Watch it change, watch it change', year: 1991, fig: '146', tag: 'CHORUS · CHANGE', scene: 'change5' },
  { t: 176.00, cn: '锂，就睡在你的手机里', en: 'Lithium asleep inside your phone', year: 1991, fig: '149', tag: 'LITHIUM', scene: 'lithium' },
  { t: 180.00, cn: '一百一十八，还不是终点', en: 'One one eight, but not the end', year: 2010, fig: '153', tag: '118', scene: 'full' },
  { t: 184.00, cn: '朋友，表上还有一个空格', en: "There's an empty box, my friend", year: 2026, fig: '157', tag: 'BEYOND', scene: 'beyond' },
  { t: 188.00, cn: '看它变化，看它变化', en: 'Watch it change, watch it change', year: 2026, fig: '161', tag: 'CHORUS · CHANGE', scene: 'finale0' },
  { t: 190.00, cn: '看它变化，看它变化', en: 'Watch it change, watch it change', year: 2026, fig: '163', tag: 'CHORUS · CHANGE', scene: 'finale1' },
  { t: 192.00, cn: '看它变化，看它变化', en: 'Watch it change, watch it change', year: 2026, fig: '165', tag: 'CHORUS · CHANGE', scene: 'finale2' },
  { t: 194.00, cn: '看它变化，看它变化', en: 'Watch it change, watch it change', year: 2026, fig: '167', tag: 'CHORUS · CHANGE', scene: 'finale3' },
  { t: 196.00, cn: '看它变化，看它变化', en: 'Watch it change, watch it change', year: 2026, fig: '169', tag: 'CHORUS · CHANGE', scene: 'finale4' },
  { t: 198.00, cn: '看它变化，看它变化', en: 'Watch it change, watch it change', year: 2026, fig: '171', tag: 'CHORUS · CHANGE', scene: 'finale5' },
  { t: 200.00, cn: '看它变化，看它变化', en: 'Watch it change, watch it change', year: 2026, fig: '173', tag: 'CHORUS · CHANGE', scene: 'finale6' },
  { t: 202.00, cn: '', en: '', year: 2026, fig: '176', tag: 'CODA', scene: 'coda' },
];
const SCENES = LINES.map((l, i) => Object.assign({}, l, {
  i, t0: l.t, t1: (i + 1 < LINES.length ? LINES[i + 1].t : 217.73),
}));

// 真实结构/常数（scenes.js 与校验脚本共用）
const DATA = {
  avogadro: 6.02214076e23,
  a0: 52.9,                    // 玻尔半径 pm
  rydberg: 1.0973731568e7,     // m^-1
  h2bond: 74,                  // pm
  benzeneCC: 139.7,            // pm
  graphiteA: 246, graphiteC: 670, // pm，石墨 a / c
  dnaPitch: 3.4, dnaBpTurn: 10.5, dnaDiameter: 2.0, // nm
  insulinA: 'GIVEQCCTSICSLYQLENYCN',
  insulinB: 'FVNQHLCGSHLVEALYLVCGERGFFYTPKT',
  disulfides: [[6, 11, 'A'], [7, 7, 'AB'], [20, 19, 'AB']],
  haber: { N2: 28.014, H2: 2.016, NH3: 17.031, T: 450, P: 200, yield: 0.15 },
  blackPowder: { KNO3: 75, S: 10, C: 15 },
  bronze: { Cu: 88, Sn: 12 },
  curie: { pitchblendeU: 0.7 },
  elementCount: 118,
  known: ELEM.filter(e => e.year <= 2026).length,
};

// 影片素材出处（图片来自 Wikimedia Commons；CC BY / CC BY-SA 需署名）
const CREDITS = {
  lavoisier: 'Jacques-Louis David, “Portrait of Monsieur Lavoisier and His Wife”, 1788. Public domain.',
  dalton: 'Thomas Phillips, “John Dalton”, 1835. Public domain.',
  mendeleev: 'Ivan Kramskoy, “Dmitri Mendeleev”, 1878. Public domain.',
  curie: '“Marie Curie”, 1903. Public domain.',
  kekule: '“Friedrich August Kekulé”, 1890s. Public domain.',
  alchemist: 'Joseph Wright of Derby, “The Alchemist Discovering Phosphorus”, 1771. Public domain.',
  bronze: 'Bronze bell, Eastern Zhou, CMOC Treasures of Ancient China. CC BY-SA 2.5, via Wikimedia Commons.',
  gunpowder: '“Black Powder”, Wikimedia Commons. CC BY-SA 3.0.',
  phosphorus: 'White phosphorus with a little red phosphorus. CC BY 3.0, via Wikimedia Commons.',
  tiangong: '“Casting a Tripod, Bell and Statue”, Tiangong Kaiwu (1637). Public domain.',
  mendeleev_table: 'Mendeleev’s periodic table, 1869. Public domain.',
  fraunhofer: 'Fraunhofer solar spectrum with the sodium D line, 1817. Public domain.',
  eclipse: 'Total solar eclipse, 1999. CC BY-SA 3.0, via Wikimedia Commons.',
  copper: 'Native copper. CC BY-SA 2.5, via Wikimedia Commons.',
  sulfur: 'Sulfur, El Desierto mine, Bolivia. CC BY-SA 4.0, via Wikimedia Commons.',
  gallium: 'Solid gallium. CC BY 3.0, via Wikimedia Commons.',
  germanium: 'Polycrystalline germanium. CC BY 3.0, via Wikimedia Commons.',
  battery: '18650 and 21700 lithium-ion cells. CC0, via Wikimedia Commons.',
  insulin_crystals: 'Insulin crystals. Public domain.',
  insulin_4ins: 'Insulin hexamer, PDB 4INS (public-domain structure), via Wikimedia Commons.',
  artemisia: 'Artemisia annua. Public domain.',
  bencao: 'Bencao Gangmu, Ming dynasty woodblock print. Public domain.',
  cyanotype: 'Anna Atkins, cyanotype of ferns, 1840s. CC0, National Gallery of Art.',
  flames: 'Coloured flames of methanol solutions of metal salts. CC BY-SA 4.0, via Wikimedia Commons.',
  bunsen: 'Bunsen burner flame types. CC BY-SA 3.0, via Wikimedia Commons.',
  prism: 'Light dispersion through a flint-glass prism. CC BY-SA 4.0, via Wikimedia Commons.',
  pitchblende: 'Pitchblende. Public domain.',
  oppau: 'Otto Bollhagen, Oppau ammonia plant, 1914. Public domain.',
  nacl: 'Sodium chloride crystals. CC BY-SA 4.0, via Wikimedia Commons.',
  fire: 'Campfire flames at night. CC BY-SA 4.0, via Wikimedia Commons.',
  candle: 'Flames in the dark. CC BY-SA 3.0, via Wikimedia Commons.',
};

// 音频实测时长（ffprobe）
const DUR = 217.733;
