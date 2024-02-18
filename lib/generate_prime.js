/**
 * Declaring all the necessary constants and importing all libraries
 */
let randomBytes = require("randombytes");
let BN = require("bn.js");

let one = new BN(1);
let two = new BN(2);
let five = new BN(5);
let sixteen = new BN(16);
let eight = new BN(8);
let ten = new BN(10);
let three = new BN(3);
let seven = new BN(7);
let eleven = new BN(11);
let four = new BN(4);
let twelve = new BN(12);
var twenty_four = new BN(24);

let Miller_Rabin = require('miller-rabin');
let miller_Rabin = new Miller_Rabin();
let primes = null;

module.exports = find_prime;
find_prime.simpleSieve = simpleSieve;
find_prime.fermatTest = fermatTest;

/**
 * @description generate a list of all prime numbers upto a certian limit `0x100000`. The numbers are gnerated by going through all the odd numbers from `3` to `0x100000`. A number goes through a test where it is checked it its divisible by all the numbers present in the array till then. If yes then simply break out of the loop. On going out of loop it is checked whether `res[j] <= sqrt(k)` this helps to know whether the loop was broken for it was a prime number not present in the list yet
 * 
 */

function _get_primes(){
    if(primes !== null){
        return primes;
    }
    let limit = 0x100000;
    let res = []
    res[0] = 2

    for(let i = 1,k = 3;k < limit; k+=2){
        let sqrt = Math.ceil(Math.sqrt(k))
        let j = 0
        for (j = 0; j < i && res[j]<=sqrt;j++){
            if ( k % res[j] === 0 ) {
                break;
            }
        }
        if(i!==j && res[j]<=sqrt){
            continue;
        }
        res[i++] = k;
    }
    primes = res;
    return res;
}
/**
 * 
 * @param {BN} num 
 */
function simpleSieve(num) {
    let primes = _get_primes();
  
    for (let i = 0; i < primes.length; i++)
      if (num.modn(primes[i]) === 0) {
        if (num.cmpn(primes[i]) === 0) {
          return true;
        } else {
          return false;
        }
      }
  
    return true;
}

/**
 * @description Fermats little test for prime numbers
 * @param {BN} num
 */
function fermatTest(num){

    let red = BN.mont(num);
    return two.toRed(red).redPow(num.subn(1)).fromRed().cmpn(1) === 0;
}

/**
 * @description function to generate prime number sof the specified length. If the specified length of the prime number is less than 16 then simply return predifined constants. If the length needed is > 16 then keep on generating numbers. If the length of the number generated is > than bits specified, we perform shift operation in the right direction. It has the same effect of dividing number by 2 to reduce length. After the length criteria is satisfied, we make the following check :
 * 1) Number is checked if its even. If it is then add 1 to the number
 * 2) the generated number's 1st bit is checked. If its not set then add 2 to the number to set the 1 st bit
 * 3) If the generator is two. Keep on dividing till the remainder on dividing by 24 is not 11. Keep adding 4 for the duration 
 * 4) If the generator is 5, keep on dividing the number by 10 till the remainder not equal to 3
 * @param {BN} bits 
 * @param {BN} gen
 */

function find_prime(bits,gen){

  if(bits < 16){
      if(gen == '02' || gen == '05'){
        return new BN([0x8c, 0x7b]);
      } else {
        return new BN([0x8c, 0x27]);
    }
  }

  gen = new BN(gen)
  let num,num2;

  while(true){

    num = new BN(randomBytes(Math.ceil(bits / 8)));
    while (num.bitLength() > bits) {
      num.ishrn(1);
    }
    if (num.isEven()) {
      num.iadd(one);
    }
    if (!num.testn(1)) {
      num.iadd(two);
    }
    if (!gen.cmp(two)) {
      while (num.mod(twenty_four).cmp(eleven)) {
        num.iadd(four);
      }
    } else if (!gen.cmp(five)) {
      while (num.mod(ten).cmp(three)) {
        num.iadd(four);
      }
    }
    num2 = num.shrn(1);
    if (simpleSieve(num2) && simpleSieve(num) &&
      fermatTest(num2) && fermatTest(num) &&
      miller_Rabin.test(num2) && miller_Rabin.test(num2)) {
      return num;
    }
  }

}