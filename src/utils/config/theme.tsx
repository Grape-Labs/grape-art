import { createTheme, makeStyles } from '@mui/material/styles';
// paper: #12151B

//background: rgb(18,21,28);
//background: linear-gradient(0deg, rgba(18,21,28,1) 10%, rgba(2,0,36,1) 35%, rgba(90,111,179,1) 100%);

 
//background: #F0F2F0;  /* fallback for old browsers */
//background: -webkit-linear-gradient(to right, #000C40, #F0F2F0);  /* Chrome 10-25, Safari 5.1-6 */
//background: linear-gradient(to right, #000C40, #F0F2F0); /* W3C, IE 10+/ Edge, Firefox 16+, Chrome 26+, Opera 12+, Safari 7+ */

//background: #141E30;  /* fallback for old browsers */
//background: -webkit-linear-gradient(to right, #243B55, #141E30);  /* Chrome 10-25, Safari 5.1-6 */
//background: linear-gradient(to right, #243B55, #141E30); /* W3C, IE 10+/ Edge, Firefox 16+, Chrome 26+, Opera 12+, Safari 7+ */


const themeInstance = {
  background: 'linear-gradient(0deg, rgba(18,21,28,1) 10%, rgba(2,0,36,1) 35%, rgba(90,111,179,1) 100%)',//'#0A1D30',

};

const theme = createTheme({
//const useStyles = makeStyles((theme: typeof themeInstance) => ({
  typography: {
    fontFamily: [
      'GrapeFont',
      'sans-serif',
    ].join(','),
  },  
  palette: {
    mode: "dark",
    background: {
      default: '#0A1D30',
      paper: "#000000"
    },
  }
});

export default theme;