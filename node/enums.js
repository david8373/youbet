var Enum = require('enum');
exports.OrderState = new Enum(['ACTIVE', 'PARTIALLYFILLED', 'FILLED', 'CANCELLED', 'EXPIRED']);
exports.ExecState = new Enum(['ACCEPTED', 'REJECTED']);
exports.BetState = new Enum(['ACTIVE', 'EXPIRED', 'SETTLED']);
