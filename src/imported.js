/* eslint-disable */ 
    import {assignImportedComponents} from 'react-imported-component';
    const applicationImports = {
      0: () => import('../web-vitals'),
    };
    assignImportedComponents(applicationImports);
    export default applicationImports;