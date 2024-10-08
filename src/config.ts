const categories: string[] = [
  'Auf dem Rummel',
  'Auf der Pizza',
  'Baumarktartikel',
  'Buchtitel',
  'Charaktereigenschaft',
  'Dinge, die blau sind',
  'Dinge, die sich drehen',
  'Erfindung',
  'Etwas, das wächst',
  'Fiktiver Charakter',
  'Frauenthemen',
  'Getränk',
  'Gewässer',
  'Himmelskörper',
  'In der Kirche',
  'In der Schule',
  'Krankheit',
  'Land',
  'Lebender Promi',
  'Luxusgut',
  'Männerthemen',
  'Musiker',
  'Name mit 5 Buchstaben',
  'Scheidungsgrund',
  'Spielname',
  'Stadt',
  'Straftat',
  'Studienfach',
  'Todesursache',
  'Typisch deutsch',
  'Wort mit 8 Buchstaben',
]

const gameSocketTemplate: string = 'wss://tools.hub.luzifer.io/ws/slf-{gameId}'

const instanceTimeout: number = 120000 // ms

export {
  categories,
  gameSocketTemplate,
  instanceTimeout,
}
