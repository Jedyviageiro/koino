const portugueseBooks: Record<string, string> = {
  Genesis: 'Gênesis', Exodus: 'Êxodo', Leviticus: 'Levítico', Numbers: 'Números', Deuteronomy: 'Deuteronômio', Joshua: 'Josué', Judges: 'Juízes', Ruth: 'Rute',
  '1 Samuel': '1 Samuel', '2 Samuel': '2 Samuel', '1 Kings': '1 Reis', '2 Kings': '2 Reis', '1 Chronicles': '1 Crônicas', '2 Chronicles': '2 Crônicas', Ezra: 'Esdras', Nehemiah: 'Neemias', Esther: 'Ester', Job: 'Jó', Psalms: 'Salmos', Proverbs: 'Provérbios', Ecclesiastes: 'Eclesiastes', 'Song of Solomon': 'Cântico dos Cânticos',
  Isaiah: 'Isaías', Jeremiah: 'Jeremias', Lamentations: 'Lamentações', Ezekiel: 'Ezequiel', Daniel: 'Daniel', Hosea: 'Oseias', Joel: 'Joel', Amos: 'Amós', Obadiah: 'Obadias', Jonah: 'Jonas', Micah: 'Miqueias', Nahum: 'Naum', Habakkuk: 'Habacuque', Zephaniah: 'Sofonias', Haggai: 'Ageu', Zechariah: 'Zacarias', Malachi: 'Malaquias',
  Matthew: 'Mateus', Mark: 'Marcos', Luke: 'Lucas', John: 'João', Acts: 'Atos', Romans: 'Romanos', '1 Corinthians': '1 Coríntios', '2 Corinthians': '2 Coríntios', Galatians: 'Gálatas', Ephesians: 'Efésios', Philippians: 'Filipenses', Colossians: 'Colossenses', '1 Thessalonians': '1 Tessalonicenses', '2 Thessalonians': '2 Tessalonicenses', '1 Timothy': '1 Timóteo', '2 Timothy': '2 Timóteo', Titus: 'Tito', Philemon: 'Filemom', Hebrews: 'Hebreus', James: 'Tiago', '1 Peter': '1 Pedro', '2 Peter': '2 Pedro', '1 John': '1 João', '2 John': '2 João', '3 John': '3 João', Jude: 'Judas', Revelation: 'Apocalipse',
};

export function localizedBibleBook(title: string, language: string) { return language.startsWith('pt') ? portugueseBooks[title] ?? title : title; }
export function localizedBibleReference(reference: string, language: string) {
  if (!language.startsWith('pt')) return reference;
  const match = Object.keys(portugueseBooks).sort((a, b) => b.length - a.length).find((title) => reference === title || reference.startsWith(`${title} `));
  return match ? `${portugueseBooks[match]}${reference.slice(match.length)}` : reference;
}
