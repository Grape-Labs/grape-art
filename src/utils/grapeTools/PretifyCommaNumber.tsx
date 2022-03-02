import React from "react"

// Convert a number to a string with commas taking into account decimal point
export function PretifyCommaNumber(props:any) { // alternatively use "toLocalString() not browser agnostic"
  
  function autoPrecision(props:any){ // TODO: PortfolioTable replace precision function with this
    const { tokenFormatValue, defaultFixed } = props;
    try{
        switch (true){
            case (+tokenFormatValue < 0.001):{
                return tokenFormatValue.toFixed(6)
            }case (+tokenFormatValue < 0.1):{
                return tokenFormatValue.toFixed(4)
            }default:{
                return tokenFormatValue.toFixed(defaultFixed)
            }
        }
    } catch(e) {
        return tokenFormatValue;
    }
  }
  
  var countDecimals = function(value:any) {
    if (Math.floor(value) !== value)
        return value.toString().split(".")[1].length || 0;
    return 0;
}

  function numberWithCommasDecimal(number:any){
    try{
        //return x.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",");
        //return x.toString().toLocaleString();
        if (number >= 1){
          //parseFloat(number).toString().toLocaleString();
          if (countDecimals(number) < 4)
            return number.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
          else 
            return number;
        }else{  
          return number;
        }
      }catch(e){ return number; }
  }
  
  return numberWithCommasDecimal(props.number);

}