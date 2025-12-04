import { Routes, Route } from 'react-router-dom';
import BrandSelector from './BrandSelector';
import BrandWorkspace from './BrandWorkspace';
import BrandSetup from './BrandSetup';

export default function FnbRoutes() {
  return (
    <Routes>
      <Route index element={<BrandSelector />} />
      <Route path="new" element={<BrandSetup />} />
      <Route path=":brandId/setup" element={<BrandSetup />} />
      <Route path=":brandId/*" element={<BrandWorkspace />} />
    </Routes>
  );
}
