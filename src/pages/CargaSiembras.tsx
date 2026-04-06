import React from 'react'
import { useSiembras } from '../hooks/useSiembras'
import FileUploader from '../components/upload/FileUploader'
import ModuleCard from '../components/shared/ModuleCard'

export default function CargaSiembras() {
  const { uploadData } = useSiembras()

  return (
    <ModuleCard title="Carga de Planos de Siembra">
      <FileUploader mode="siembras" onUpload={uploadData} />
    </ModuleCard>
  )
}
