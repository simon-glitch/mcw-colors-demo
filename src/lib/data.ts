/* == Abstract data structures == */

type TypedArray = Uint8Array | Uint16Array | Uint32Array;

/**
 * Base class for compressing binary data into a TypedArray.
 */
class UintData{
  d: TypedArray;
  dv: DataView;
  constructor(d: TypedArray){
      this.d = d;
      this.dv = new DataView(d.buffer);
  }
  /**
   * @abstract
   * Get the value at index `i`, using the access type (see `MakeData`).
   * @param i index
   */
  g(i: number | BigInt){
    return 0;
  }
  /**
   * @abstract
   * Set the value at index `i`, using the access type (see `MakeData`).
   * @param i index
   * @param v value
   */
  s(i: number | BigInt, v: number | BigInt){}
  g_bigint(i: number){
    return this.dv.getBigUint64(i * 8);
  }
  g_float(i: number){
    return this.dv.getFloat32(i * 4);
  }
  g_int(i: number){
    return this.dv.getUint32(i * 4);
  }
  g_short(i: number){
    return this.dv.getUint16(i * 2);
  }
  g_byte(i: number){
    return this.dv.getUint8(i);
  }
  s_bigint(i: number, v: bigint){
    return this.dv.setBigUint64(i * 8, v);
  }
  s_float(i: number, v: number){
    return this.dv.setFloat32(i * 4, v);
  }
  s_int(i: number, v: number){
    return this.dv.setUint32(i * 4, v);
  }
  s_short(i: number, v: number){
    return this.dv.setUint16(i * 2, v);
  }
  s_byte(i: number, v: number){
    return this.dv.setUint8(i, v);
  }
}

/**
 * Compress binary data into a Uint32Array.
 */
class Uint32Data extends UintData{
  d: Uint32Array = new Uint32Array(0);
  constructor(length: number){
      super(new Uint32Array(length));
  }
  /** returns Uint4 (nibble); */
  g_nibble(i: number){
    return (this.d[i >>> 3] & (0xf << ((i & 0x7) << 2)));
  }
  /** returns boolean; */
  g_bool(i: number){
    return ((this.d[i >>> 5] >>> (0x1f - (i & 0x1f))) & 1);
  }
  /** sets Uint4 (nibble); */
  s_nibble(i: number, v: number){
    // remove existing value;
    this.d[i >>> 3] &= ~(0xf << ((i & 0x7) << 2));
    // then replace it;
    this.d[i >>> 3] |= ((v & 0xf) << ((i & 0x7) << 2));
  }
  /** sets boolean; */
  s_bool(i: number, v: number){
    // bit masking!
    if(v) this.d[i >>> 5] |=  (1 << (0x1f - (i & 0x1f)));
    else  this.d[i >>> 5] &= ~(1 << (0x1f - (i & 0x1f)));
  }
}

/**
 * Compress binary data into a Uint16Array.
 */
class Uint16Data extends UintData{
  d: Uint16Array = new Uint16Array(0);
  constructor(length: number){
      super(new Uint16Array(length));
  }
  /** returns Uint4 (nibble); */
  g_nibble(i: number){
    return (this.d[i >>> 2] & (0xf << ((i & 0x3) << 2)));
  }
  /** returns boolean; */
  g_bool(i: number){
    return ((this.d[i >>> 4] >>> (0x1f - (i & 0xf))) & 1);
  }
  /** sets Uint4 (nibble); */
  s_nibble(i: number, v: number){
    // remove existing value;
    this.d[i >>> 2] &= ~(0xf << ((i & 0x3) << 2));
    // then replace it;
    this.d[i >>> 2] |= ((v & 0xf) << ((i & 0x3) << 2));
  }
  /** sets boolean; */
  s_bool(i: number, v: number){
    // bit masking!
    if(v) this.d[i >>> 4] |=  (1 << (0x1f - (i & 0xf)));
    else  this.d[i >>> 4] &= ~(1 << (0x1f - (i & 0xf)));
  }
}

/**
 * Compress binary data into a Uint16Array.
 */
class Uint8Data extends UintData{
    d: Uint8Array = new Uint8Array(0);
  constructor(length: number){
      super(new Uint8Array(length));
  }
  /** returns Uint4 (nibble); */
  g_nibble(i: number){
    return (this.d[i >>> 1] & (0xf << ((i & 0x1) << 2)));
  }
  /** returns boolean; */
  g_bool(i: number){
    return ((this.d[i >>> 3] >>> (0x7 - (i & 0x7))) & 1);
  }
  /** sets Uint4 (nibble); */
  s_nibble(i: number, v: number){
    // remove existing value;
    this.d[i >>> 1] &= ~(0xf << ((i & 0x1) << 2));
    // then replace it;
    this.d[i >>> 1] |= ((v & 0xf) << ((i & 0x1) << 2));
  }
  /** sets boolean; */
  s_bool(i: number, v: number){
    // bit masking!
    if(v) this.d[i >>> 3] |=  (1 << (0x7 - (i & 0x7)));
    else  this.d[i >>> 3] &= ~(1 << (0x7 - (i & 0x7)));
  }
}

/**
 * Compress binary data into a Uint32Array.
 * Allows for up to 2**53 items of any data type.
 */
class JSUint32Data extends UintData{
  d: Uint32Array = new Uint32Array(0);
  constructor(length: number){
      super(new Uint32Array(length));
  }
  /** returns Uint4 (nibble); */
  g_nibble(i: number){
    return (this.d[(i / 8) | 0] & (0xf << ((i & 0x7) << 2)));
  }
  /** returns boolean; */
  g_bool(i: number){
    return ((this.d[(i / 32) | 0] >>> (0x1f - (i & 0x1f))) & 1);
  }
  /** sets Uint4 (nibble); */
  s_nibble(i: number, v: number){
    // remove existing value;
    this.d[(i / 8) | 0] &= ~(0xf << ((i & 0x7) << 2));
    // then replace it;
    this.d[(i / 8) | 0] |= ((v & 0xf) << ((i & 0x7) << 2));
  }
  /** sets boolean; */
  s_bool(i: number, v: number){
    // bit masking!
    if(v) this.d[(i / 32) | 0] |=  (1 << (0x1f - (i & 0x1f)));
    else  this.d[(i / 32) | 0] &= ~(1 << (0x1f - (i & 0x1f)));
  }
}

/**
 * Compress binary data into a Uint16Array.
 * Allows for up to 2**53 items of any data type.
 */
class JSUint16Data extends UintData{
  d: Uint16Array = new Uint16Array(0);
  constructor(length: number){
      super(new Uint16Array(length));
  }
  /** returns Uint4 (nibble); */
  g_nibble(i: number){
    return (this.d[(i / 4) | 0] & (0xf << ((i & 0x3) << 2)));
  }
  /** returns boolean; */
  g_bool(i: number){
    return ((this.d[(i / 16) | 0] >>> (0xf - (i & 0xf))) & 1);
  }
  /** sets Uint4 (nibble); */
  s_nibble(i: number, v: number){
    // remove existing value;
    this.d[(i / 4) | 0] &= ~(0xf << ((i & 0x3) << 2));
    // then replace it;
    this.d[(i / 4) | 0] |= ((v & 0xf) << ((i & 0x3) << 2));
  }
  /** sets boolean; */
  s_bool(i: number, v: number){
    // bit masking!
    if(v) this.d[(i / 16) | 0] |=  (1 << (0xf - (i & 0xf)));
    else  this.d[(i / 16) | 0] &= ~(1 << (0xf - (i & 0xf)));
  }
}

/**
 * Compress binary data into a Uint16Array.
 * Allows for up to 2**53 items of any data type.
 */
class JSUint8Data extends UintData{
  d: Uint8Array = new Uint8Array(0);
  constructor(length: number){
      super(new Uint8Array(length));
  }
  /** returns Uint4 (nibble); */
  g_nibble(i: number){
    return (this.d[(i / 2) | 0] & (0xf << ((i & 0x1) << 2)));
  }
  /** returns boolean; */
  g_bool(i: number){
    return ((this.d[(i / 8) | 0] >>> (0x7 - (i & 0x7))) & 1);
  }
  /** sets Uint4 (nibble); */
  s_nibble(i: number, v: number){
    // remove existing value;
    this.d[(i / 2) | 0] &= ~(0xf << ((i & 0x1) << 2));
    // then replace it;
    this.d[(i / 2) | 0] |= ((v & 0xf) << ((i & 0x1) << 2));
  }
  /** sets boolean; */
  s_bool(i: number, v: number){
    // bit masking!
    if(v) this.d[(i / 8) | 0] |=  (1 << (0x7 - (i & 0x7)));
    else  this.d[(i / 8) | 0] &= ~(1 << (0x7 - (i & 0x7)));
  }
}

/**
 * Specifies the names of the data types in UintData. This also acts as configuration for MakeData.
 */
const uint_data_types = {
    bit: {bits: 1,},
    nibble: {bits: 4,},
    byte: {bits: 8, data: Uint8Data, js_data: JSUint8Data,},
    short: {bits: 16, data: Uint16Data, js_data: JSUint16Data,},
    int: {bits: 32, data: Uint32Data, js_data: JSUint32Data,},
    float: {bits: 32,},
}
/**
 * Automatically call the neccessary UintData constructor, and add s and g methods for the access type.
 * @param length {number} the length, in terms of items of the access type;
 * @param storage_type {string} the storage type; i.e. how the data is actually represented;
 * @param access_type {string} the access type; i.e. the type of data you want to get/set by default;
 * @param js {bool} whether to use division instead of bitshifts in the internal methods, in order to allow there to be upto 2**53 bits, instead of upto to 2**32;
 * returns {UintData | BigUint64Data} also adds the following methods
 * - `g(i: number | BigInt) => (number | BigInt)` a getter which returns a value of the access type; `i` is the index, and `i` must have a type supported by the storage type;
 * - `s(i: number | BigInt, v: number | BigInt) => void` a getter which sets a value of the access type; `i` is the index, `v` is the value to set, and both parameters must have types supported by the storage type;
 */
function MakeData(length: number, storage_type: "byte" | "short" | "int", access_type: "bit" | "nibble" | "byte" | "short" | "int" | "float", js = false){
    const st = uint_data_types[storage_type];
    const at = uint_data_types[access_type];
    if(!st) throw TypeError(`${storage_type} is not a valid data type name;`);
    if(!at) throw TypeError(`${access_type} is not a valid data type name;`);
    const bit_length = at.bits * length;
    if(st.js_data && !js && bit_length > 2**32) throw RangeError(`length is too large; set js = true;`);
    const st_length = Math.ceil(bit_length / st.bits);
    // this could be `SC = js && st.js_data || st.data;` instead, but that would be very confusing;
    const SC =
      (js && (st as any).js_data) ?
      (st as any).js_data : (st as any).data;
    const AC =
      (js && (at as any).js_data) ?
      (at as any).js_data : (at as any).data;
    const o = new SC(st_length);
    o.g = (SC === AC) ? MakeData.g : (o as any)["g_" + access_type];
    o.s = (SC === AC) ? MakeData.s : (o as any)["s_" + access_type];
    return o;
}
/** Virtual method that goes on the object returned by MakeData, if it is appropriate. */
MakeData.g = function(i: number){
    return (this as any).d[i];
}
/** Virtual method that goes on the object returned by MakeData, if it is appropriate. */
MakeData.s = function(i: number, v: number | BigInt){
    (this as any).d[i] = v;
}

export { UintData, MakeData };
