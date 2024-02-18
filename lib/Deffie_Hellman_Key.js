let BN = require("bn.js")
let Miller_Rabin = require("miller-rabin");
const randomBytes = require("randombytes");
let miller_rabin= new Miller_Rabin()
let twenty_four = new BN(24);
let eleven = new BN(11);
let ten = new BN(10);
let three = new BN(3);
let seven = new BN(7);
let primes = require("../lib/generate_prime")

/**
* @description Set Public Key for Deffie Hellman Key exchange
*/
function set_public_key(key,enc){

    enc = enc || 'utf8';
    if(!Buffer.isBuffer(key)){
        key = Buffer.from(key,enc)
    }
    this._pub_key = new BN(key)
    return this
}

/*
* Set Private Key for Deffie Hellman Key exchange
*/ 
function set_private_key(key,enc){

    enc = enc || 'utf8';
    if(!Buffer.isBuffer(key)){
        key = Buffer.from(key,enc);
    }
    this._private_key = new BN(key);
    return this;
}


let primeCache = {};
/**
* @description Check if the given public is a valid prime or not
* For checking if the number is Prime or not we use 3 test:
* 1) Fermats Test : a^p - a must be a multiple of number for all 1<=a<num  
* 2) Miller-Rabin Test: (num = 2^k + m); (b0 = (a^m) % n; b1 = (b0^2)%n ..... )
* 3) simpleSieve Test
*/
function checkPrime(prime,generator){
    
    let gen_hex = generator.toString('hex');
    let hex = [gen_hex,prime.toString(16)].join("_");
    if (hex in primeCache){
            return primeCache[hex];
    }
    let error = 0;
    if (prime.isEven()||
        !miller_rabin.test(prime)||
        !primes.fermatTest(prime)||
        !primes.simpleSieve(prime)
    ) {
        
        error+=1
        console.log(gen_hex)
        if(gen_hex === "2" || gen_hex === "5" ){
            error+=8;
        }else{
            error+=4;
        }
        primeCache[hex] = error;
        return error;
    }

    if (!miller_rabin.test(prime.shrn(1))) {
        error+=2;
    }

    let rem;
    switch(gen_hex){

        case "2":
            if(prime.mod(twenty_four).cmp(eleven)){
                error+=8;
            }
            break;
            case "5":
                rem = prime.mod(ten);
                if (rem.cmp(three) && rem.cmp(seven)) {
                  error += 8;
                }
                break;
            default:
                error += 4;
            }
    primeCache[hex] = error;
    return error;
}

/**
 * @description Set the properties of Deffie Hellman: 
 * a) Sets the generator (_gen) to the supplied number
 * b) Sets the Montgomery Representation (__gen) of the generator
 * c) Sets the Prime Number(__prime_number) to a big number using the BN.js library 
 * d) Sets the Mongomery Representation (__prime) of the prime number
 *   
 */

function DeffieHellman(prime,generator,malleable)
{
    this.set_generator(generator);
    this.__prime_number = new BN(prime);
    this.__prime = BN.mont(this.__prime_number);
    this._len_prime = prime.length;
    this._publicKey = undefined;
    this._privateKey = undefined;
    this._group = undefined;

    

    if (malleable) {
        this.set_public_key = set_public_key;
        this.set_private_key = set_private_key;
    }
    else{
        this._group = 8 ;
    }
}

/**
 * @description Defines the property (verifyError) of the function DeffieHellman as non enumerable and assigns the errorCode(Validitiy of the prime number selected) as returned by checkPrime 
 */
Object.defineProperty(DeffieHellman.prototype,'verifyError',{
    enumerable:false,
    get:function(){
        if(typeof this._group !== "number"){
            this._group = checkPrime(this.__prime_number,this._gen);
        }

        return this._group
    }
})

/**
 *@description generates the private key with same length as the chosen prime number. 
 * generates the public key as gen ^ (privateKey) % prime
 */
DeffieHellman.prototype.generate_keys = function() {
    if(!this._privateKey){
        this._privateKey = new BN(randomBytes(this._len_prime))
    }
    this._publicKey = this._gen.toRed(this.__prime).redPow(this._privateKey).fromRed();
    return this.get_public_key()
}

/**
 * 
 * @param {string} enc 
 * @returns the public key in formated way according to specific encoding provided
 */

DeffieHellman.prototype.get_public_key = function get_public_key(enc) {
    return formatReturnValue(this._publicKey, enc);
  };
  
/**
 * 
 * @param {string} enc 
 * @returns private key in formated way according to specific encoding provided
 */
  DeffieHellman.prototype.get_private_key = function get_private_key(enc) {
    return formatReturnValue(this._privateKey, enc);
  };

  /**
   * 
   * @param {*} key 
   * @returns 
   */
  DeffieHellman.prototype.compute_secret = function (key) {
    key = new BN(key);
    key = key.toRed(this.__prime);
    let secret = key.redPow(this._privateKey).fromRed();
    let buf = Buffer.from(secret.toArray())
    let prime = this.get_prime();
    if (buf.length < prime.length) {
      let ahead = (prime.length - buf.length);
      ahead.fill(0);
      buf = Buffer.concat([ahead, buf]);
    }
    return buf;
  };

  /**
   * 
   * @param {string} enc 
   * @returns prime number in formated way according to specific encoding provided
   */
  DeffieHellman.prototype.get_prime = function (enc) {
    return formatReturnValue(this.__prime_number, enc);
  };

  

  /**
   * 
   * @param {string} enc 
   * @returns generator in formated way according to the encoding given
   */
  
  DeffieHellman.prototype.get_generator = function (enc) {
    return formatReturnValue(this._group, enc);
  };
  
  DeffieHellman.prototype.set_generator = function (gen, enc) {
    enc = enc || 'utf8';
    if (!Buffer.isBuffer(gen)) {
      gen = Buffer.from(gen, enc);
    }
    this.__gen = gen;
    this._gen = new BN(gen);
    return this;
  };
  
  function formatReturnValue(bn, enc) {
    let buf = Buffer.from(bn.toArray());
    if (!enc) {
      return buf;
    } else {
      return buf.toString(enc);
    }
  }

module.exports = DeffieHellman