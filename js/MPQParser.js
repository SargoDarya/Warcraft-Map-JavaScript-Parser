importScripts('MPQArchive.js');

var MPQParser = function(dataView)
{
  this.view = dataView;
  this.archive = new MPQArchive();
  this.archiveOffset = 512;

  this.hTable = "(hash table)";
  this.bTable = "(block table)";

  this.blockTable = [];
  this.hashTable = [];
  this.cryptTable = [];

  this.parseHeader();
  this.prepareEncryptionTable();
  this.decryptBlockTable('', this.bTable, this.header.blockTableEntries*4);
};

MPQParser.prototype.parseHeader = function()
{
  this.view._offset = this.archiveOffset;
  this.header = {};
  this.header.magicBytes = this.view.getString(4);
  this.header.headerSize = this.view.getInt32();
  this.header.archiveSize = this.view.getInt32();
  this.header.formatVersion = this.view.getInt16();
  this.header.sectorSizeShift = this.view.getInt16();
  this.header.hashTableOffset = this.view.getInt32();
  this.header.blockTableOffset = this.view.getInt32();
  this.header.hashTableEntries = this.view.getInt32();
  this.header.blockTableEntries = this.view.getInt32();
  
  // check for burning crusade, senseless but we'll check
  if(this.header.formatVersion!=0) {
    this.header.extendedBlockTableOffset = this.view.getInt64();
    this.header.hashTableOffsetHigh = this.view.getInt16();
    this.header.blockTableOffsetHigh = this.view.getInt16();
  }
};

MPQParser.prototype.parseBlockTable = function() {
  this.view.seek(parseInt(this.header.blockTableOffset)+parseInt(this.archiveOffset));
  for(var i=0; i<this.header.blockTableEntries; i++) {
    var block = {};
    block.offset = this.view.getInt32();
    block.size = this.view.getInt32();
    block.fileSize = this.view.getInt32();
    block.flags = this.view.getInt32();
    this.blockTable.push(block);
  };
  self.postMessage(this.view._offset);
};

MPQParser.prototype.parseHashTable = function() {
  this.view.seek(parseInt(this.header.hashTableOffset)+parseInt(this.archiveOffset));
  for(var i=0; i<this.header.hashTableEntries; i++) {
    var hash = {};
    hash.filePathHashA = this.view.getInt32();
    hash.filePathHashB = this.view.getInt32();
    hash.language = this.view.getInt16();
    hash.platform = this.view.getInt16();
    hash.fileBlockIndex = this.view.getInt32();
    this.hashTable.push(hash);
  };
};

MPQParser.prototype.prepareEncryptionTable = function() {
  var seed = 0x00100001, index1 = 0, index2 = 0, i;
  
  for(index1 = 0; index1 < 0x100; index1++)
  {
    for(index2 = index1, i = 0; i < 5; i++, index2 += 0x100)
    {
      var temp1, temp2;
      
      seed = (seed * 125 + 3) & 0x2AAAAB;
      temp1 = (seed & 0xFFFF) << 0x10;
      
      seed = (seed * 125 + 3) % 0x2AAAAB;
      temp2 = (seed & 0xFFFF);
      
      this.cryptTable[index2] = (temp1 | temp2);
    }
  }
};

MPQParser.prototype.decryptBlockTable = function(dwBlock, dwKey, dwLength) 
{
  var dwSeed1 = 0x7FED7FED,
      dwSeed2 = 0xEEEEEEEE,
      ch;

  while(dwKey != 0) {
    ch = dwKey.slice(0, 1).toUpperCase().charCodeAt(0);
    dwKey = dwKey.substr(1);
    
    dwSeed1 = this.cryptTable[0x300 + ch] ^ (dwSeed1 + dwSeed2);
    dwSeed2 = ch + dwSeed1 + dwSeed2 + (dwSeed2 << 5) + 3;
  };
  
  dwSeed2 = 0xEEEEEEEE;

  while(dwLength-- > 0)
  {
    dwSeed2 += this.cryptTable[0x400 + (dwSeed1 & 0xFF)];
    ch       = dwBlock ^ (dwSeed1 + dwSeed2);

    self.postMessage(ch);

    dwSeed1   = ((dwSeed1 << 0x15) + 0x11111111) | (dwSeed1 >> 0x0B);
    dwSeed2   = ch + dwSeed2 + (dwSeed2 << 5) + 3;
    //dwBlock = ch;
  }
};