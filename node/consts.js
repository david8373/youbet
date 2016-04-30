exports.EPSILON = 1.0e-7;
exports.DEPTH_LEVELS = 3;

exports.RDS_POSTGRES_CONN_STRING = "postgres://david8373:%s@david8373-youbet-db.cesjjcp6a6ro.us-west-2.rds.amazonaws.com:5432/youbet_db";
//exports.RDS_POSTGRES_CONN_STRING = "postgres://mnvetwgvwupekd:%s@ec2-54-197-251-18.compute-1.amazonaws.com:5432/ddq0nrd6anof31";

exports.USERNAME_RE = /^[a-zA-Z0-9_-]{3,20}$/;
exports.BETNAME_RE = /^[a-zA-Z0-9_-]{3,20}$/;
exports.PASSWORD_RE = /^.{3,20}$/;
exports.EMAIL_RE = /^[\S]+@[\S]+\.[\S]+/;

exports.LOBBY_ROOM_NAME = "__LOBBY_ROOM_NAME__";

exports.SHA_ALGORITHM = 'md5';

