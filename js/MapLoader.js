importScripts("WorkerConsole.js", "BinaryLoader.js", "jdataview.js", "StringUtil.js", "MPQParser.js");

var view = null;
var map = {};

function parseMap(data)
{
  view = new jDataView(data);
  parseHeader();
  parseFooter();
  parseMPQ();
  self.postMessage(map);
};

function parseHeader()
{
  map.header = {};
  map.header.type = view.getString(4);
  view.getInt32();
  map.header.name = view.getBlizzardString();
  map.header.flags = view.getInt32();
  map.header.maxPlayers = view.getInt32();
};

function parseMPQ()
{
  map.mpq = new MPQParser(view);
};

function parseFooter()
{
  map.footer = {};
  map.footer.type = view.getString(4, view.byteLength-260);
  map.footer.auth = view.getString(256);
};

self.addEventListener('message', function(e) {
  BinaryLoader(e.data, parseMap);
}, false);