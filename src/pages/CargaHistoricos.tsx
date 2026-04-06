import React from 'react'
import { useHistoricos } from '../hooks/useHistoricos'
import FileUploader from '../components/upload/FileUploader'
import ModuleCard from '../components/shared/ModuleCard'

export default function CargaHistoricos() {
  const { uploadData } = useHistoricos()

  return (
    <ModuleCard title="Carga de Históricos">
      <FileUploader mode="historicos" onUpload={uploadData} />
    </ModuleCard>
  )
}
