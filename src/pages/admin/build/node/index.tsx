import React from 'react';
import { Routes, Route } from 'react-router-dom';
import NodeLibraryList from './NodeLibraryList';
import NodeLibraryBuilder from './NodeLibraryBuilder';

export default function NodeLibraryRoutes() {
  return (
    <Routes>
      <Route index element={<NodeLibraryList />} />
      <Route path="new" element={<NodeLibraryBuilder />} />
      <Route path=":id" element={<NodeLibraryBuilder />} />
    </Routes>
  );
}