import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { avasys } from '@/api/avasysClient'
import { usePortalData, yearlyPremium as _yearlyPremium } from './usePortalData'

// Legacy hook — now delegates to usePortalData for unified data loading
export function usePortalCustomer() {
  const navigate = useNavigate()
  const customerId = localStorage.getItem('portal_customer_id')

  useEffect(() => {
    if (!customerId) navigate('/portal/setup')
  }, [customerId, navigate])

  const { customer, isLoading, error } = usePortalData()
  return { customer, customerId, isLoading, error }
}

export { _yearlyPremium as yearlyPremium }

function mergeById(a, b) {
  const map = {}
  ;[...(a || []), ...(b || [])].forEach(x => { map[x.id] = x })
  return Object.values(map)
}

export async function fetchPortalContracts(customerId) {
  const [d, p] = await Promise.all([
    avasys.entities.Contract.filter({ customer_id: customerId }),
    avasys.entities.Contract.filter({ primary_customer_id: customerId }),
  ])
  return mergeById(d, p)
}

export async function fetchPortalApplications(customerId) {
  const [d, p] = await Promise.all([
    avasys.entities.Application.filter({ customer_id: customerId }),
    avasys.entities.Application.filter({ primary_customer_id: customerId }),
  ])
  return mergeById(d, p)
}

export async function fetchPortalDocuments(customerId) {
  const [d, p] = await Promise.all([
    avasys.entities.Document.filter({ customer_id: customerId }),
    avasys.entities.Document.filter({ primary_customer_id: customerId }),
  ])
  return mergeById(d, p).filter(doc => doc.visible_in_portal !== false)
}