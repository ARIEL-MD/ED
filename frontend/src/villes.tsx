// Villes proposées (on peut aussi taper une autre ville)
const VILLES = ["Abidjan", "Bouaké", "Yamoussoukro", "Daloa", "San-Pédro", "Korhogo", "Man", "Gagnoa", "Divo", "Abengourou", "Grand-Bassam", "Bingerville", "Dabou", "Agboville", "Adzopé", "Soubré", "Odienné", "Séguéla", "Ferkessédougou", "Bondoukou", "Sassandra", "Issia", "Oumé", "Toumodi", "Dimbokro", "Bouaflé", "Sinfra", "Katiola", "Boundiali", "Tiassalé"];
export const Villes = () => <datalist id="villes">{VILLES.map(v => <option key={v} value={v} />)}</datalist>;
