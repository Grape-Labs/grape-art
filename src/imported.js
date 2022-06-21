/* eslint-disable */ 
import {assignImportedComponents} from 'react-imported-component';
const applicationImports = {
  "0": () => import('./App'),
};
assignImportedComponents(applicationImports);
export default applicationImports;