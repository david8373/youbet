var Bet = require('../node/bet.js');

var DbClient = require('../node/db_client.js');
DbClient.create();

var d = new Date();
d.setDate(d.getDate() + 3);
var bet = new Bet("YuhanBet0", "Yuhan's Bet 0 description", "david8373", d, 0.0, 1.0, 0.05, true);
bet.addParticipant('Jing');
bet.submit('david8373', true, 0.00, 30);
bet.submit('david8373', true, 0.05, 30);
bet.submit('david8373', true, 0.10, 30);
bet.submit('david8373', true, 0.15, 30);
bet.submit('david8373', true, 0.20, 30);
bet.submit('david8373', true, 0.25, 30);
bet.submit('david8373', true, 0.30, 30);
bet.submit('david8373', true, 0.35, 30);
bet.submit('david8373', true, 0.40, 30);
bet.submit('david8373', true, 0.45, 30);
bet.submit('david8373', true, 0.50, 30);
bet.submit('david8373', true, 0.55, 30);
bet.submit('david8373', true, 0.60, 30);
bet.submit('david8373', true, 0.65, 30);
bet.submit('david8373', true, 0.70, 30);
bet.submit('david8373', true, 0.75, 30);
bet.submit('david8373', true, 0.80, 30);
bet.submit('david8373', true, 0.85, 30);
bet.submit('Jing', false, 0.90, 20);
bet.submit('Jing', false, 0.95, 20);
bet.submit('Jing', false, 1.00, 20);

POSTGRES_CLIENT.on('drain', POSTGRES_CLIENT.end.bind(POSTGRES_CLIENT));
