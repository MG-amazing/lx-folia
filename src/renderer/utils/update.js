// LX Folia never queries upstream release metadata.
export const getVersionInfo = async() => ({ version: process.versions.app, desc: 'LX Folia: automatic updates disabled', history: [] })
