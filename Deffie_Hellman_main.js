let DH = require('./lib/Deffie_Hellman_Key');
let primes = require('./lib/primes.json')
let Papa = require("papaparse")
let fs = require('fs')
let mods = [
    'modp1','modp2'
 ];



function get_Deffie_Hellman (mod) {
        let prime = Buffer.from(primes[mod].prime,'hex')
        let generator = Buffer.from(primes[mod].gen, 'hex')
      
        return new DH(prime, generator,true)
}


function execute_deffie_hellman(){
    let data_json = []
    mods.forEach(function(mod){
        let dh1 = get_Deffie_Hellman(mod);
        let p1 = dh1.get_prime();
        dh1.generate_keys();
        let s1 = dh1.get_private_key('hex')


        let dh2 = get_Deffie_Hellman(mod);
        dh2.generate_keys();
        let s2 = dh2.get_private_key('hex')

        let public_key1 = dh1.get_public_key();
        let public_key2 = dh2.get_public_key();

        let pub1 = dh1.compute_secret(public_key2).toString('hex');
        let pub2 = dh2.compute_secret(public_key1).toString('hex');

        p1 = dh1.get_prime('hex');
        public_key1 = dh1.get_public_key('hex');
        public_key2 = dh2.get_public_key('hex');


        data_json.push(

                
                    
                    {
                        "modp":mod,
                       "Result":`${pub1 == pub2}`,
                        "Prime": `${p1}`,
                        "Error for Prime Chosen": `${dh1.verifyError}`,
                    
                    
                        "Name":"Alice",
                        "Secret Key": `${s1}`,
                        "Public Key": `${public_key1}`,
                        "Shared Secret":`${pub1}`,
                    
                        "Name":"Bob",
                        "Secret Key" : `${s2}`,
                        "Public Key": `${public_key2}`,
                        "Shared Secret":`${pub2}`
                    }
                
        ) 

    })

    let data_csv  = Papa.unparse(data_json)
    console.log(data_csv);
    fs.writeFileSync('output.csv', data_csv);

}

execute_deffie_hellman()


