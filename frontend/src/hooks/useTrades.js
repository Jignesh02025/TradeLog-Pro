import { useMemo, useState, useEffect } from 'react'
import { v4 as uuid } from 'uuid'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { calculatePips, calculateProfit, getPipValue, calculateRR } from '../utils/forexCalculations'
import useLocalStorage from './useLocalStorage'

const DEFAULT_SETTINGS = {
  defaultCurrency: 'USD',
  riskPercentage: 1.0,
  theme: 'dark',
}

function useTrades() {
  const { user } = useAuth()
  const [trades, setTrades] = useState([])
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useLocalStorage('tradelog_settings', DEFAULT_SETTINGS)

  // Settings Migration & Initialization
  useEffect(() => {
    const s = settings
    if (s && s.currency && !s.defaultCurrency) {
      setSettings({
        ...settings,
        defaultCurrency: s.currency,
        riskPercentage: s.riskPercentage || 1.0,
      })
    } else if (s && !s.riskPercentage) {
      setSettings({
        ...settings,
        riskPercentage: 1.0
      })
    }
  }, [settings, setSettings])

  // Fetch trades from Supabase on mount or user change
  useEffect(() => {
    if (!user) {
      setTrades([])
      setLoading(false)
      return
    }

    const fetchTrades = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .order('date', { ascending: false })

      if (error) {
        console.error('Error fetching trades:', error)
      } else {
        // Map snake_case to camelCase
        const mapped = (data || []).map(t => ({
          id: t.id,
          date: t.date,
          pair: t.pair,
          type: t.type,
          lotSize: Number(t.lot_size),
          entryPrice: Number(t.entry_price),
          exitPrice: Number(t.exit_price),
          stopLoss: (t.stop_loss !== null && t.stop_loss !== undefined) ? Number(t.stop_loss) : undefined,
          takeProfit: (t.take_profit !== null && t.take_profit !== undefined) ? Number(t.take_profit) : undefined,
          pips: Number(t.pips),
          pipValue: Number(t.pip_value),
          profitLoss: Number(t.profit_loss),
          manualOverride: t.manual_override,
          riskReward: t.risk_reward ? Number(t.risk_reward) : 0,
          tradeResult: t.trade_result,
          notes: t.notes || '',
          screenshots: t.screenshot_url ? t.screenshot_url.split(',') : [],
          createdAt: t.created_at
        }))
        console.log('[FRONTEND] Fetched trades from Supabase:', mapped)
        setTrades(mapped)
      }
      setLoading(false)
    }

    fetchTrades()
  }, [user])

  const addTrade = async (form) => {
    if (!user) return null

    const entry = parseFloat(form.entryPrice)
    const exit = parseFloat(form.exitPrice)
    const lots = parseFloat(form.lotSize)
    const sl = form.stopLoss ? parseFloat(form.stopLoss) : undefined
    const tp = form.takeProfit ? parseFloat(form.takeProfit) : undefined
    
    const pips = calculatePips(form.pair, entry, exit, form.type)
    const rr = calculateRR(entry, sl, tp, form.type)
    
    let pipValue = parseFloat(form.pipValue)
    if (!form.isPipValueManual) {
      pipValue = getPipValue(form.pair, lots)
    }

    let profitLoss = parseFloat(form.profitLoss)
    if (!form.manualOverride) {
      profitLoss = calculateProfit(pips, pipValue)
    }

    const tradeResult = form.tradeResult || (profitLoss > 0 ? 'Win' : profitLoss < 0 ? 'Loss' : 'Breakeven')

    const tradeData = {
      user_id: user.id,
      date: form.date,
      pair: form.pair.toUpperCase().trim(),
      type: form.type,
      lot_size: lots,
      entry_price: entry,
      exit_price: exit,
      stop_loss: sl,
      take_profit: tp,
      pips: pips,
      pip_value: pipValue,
      profit_loss: profitLoss,
      manual_override: form.manualOverride,
      risk_reward: rr,
      trade_result: tradeResult,
      notes: form.notes.trim(),
      screenshot_url: form.screenshots && form.screenshots.length > 0 ? form.screenshots.join(',') : null,
    }

    const { data, error } = await supabase
      .from('trades')
      .insert([tradeData])
      .select()
      .single()

    if (error) {
      console.error('Error adding trade:', error)
      return null
    }

    const newTrade = {
      id: data.id,
      date: data.date,
      pair: data.pair,
      type: data.type,
      lotSize: Number(data.lot_size),
      entryPrice: Number(data.entry_price),
      exitPrice: Number(data.exit_price),
      stopLoss: data.stop_loss ? Number(data.stop_loss) : undefined,
      takeProfit: data.take_profit ? Number(data.take_profit) : undefined,
      pips: Number(data.pips),
      pipValue: Number(data.pip_value),
      profitLoss: Number(data.profit_loss),
      manualOverride: data.manual_override,
      riskReward: Number(data.risk_reward),
      tradeResult: data.trade_result,
      notes: data.notes || '',
      screenshots: data.screenshot_url ? data.screenshot_url.split(',') : [],
      createdAt: data.created_at
    }

    setTrades(prev => [newTrade, ...prev])
    return newTrade
  }

  const updateTrade = async (id, form) => {
    if (!user) return

    const entry = parseFloat(form.entryPrice)
    const exit = parseFloat(form.exitPrice)
    const lots = parseFloat(form.lotSize)
    const sl = form.stopLoss ? parseFloat(form.stopLoss) : undefined
    const tp = form.takeProfit ? parseFloat(form.takeProfit) : undefined
    
    const pips = calculatePips(form.pair, entry, exit, form.type)
    const rr = calculateRR(entry, sl, tp, form.type)
    
    let pipValue = parseFloat(form.pipValue)
    if (!form.isPipValueManual) {
      pipValue = getPipValue(form.pair, lots)
    }

    let profitLoss = parseFloat(form.profitLoss)
    if (!form.manualOverride) {
      profitLoss = calculateProfit(pips, pipValue)
    }

    const tradeResult = form.tradeResult || (profitLoss > 0 ? 'Win' : profitLoss < 0 ? 'Loss' : 'Breakeven')

    const updateData = {
      date: form.date,
      pair: form.pair.toUpperCase().trim(),
      type: form.type,
      lot_size: lots,
      entry_price: entry,
      exit_price: exit,
      stop_loss: sl,
      take_profit: tp,
      pips: pips,
      pip_value: pipValue,
      profit_loss: profitLoss,
      manual_override: form.manualOverride,
      risk_reward: rr,
      trade_result: tradeResult,
      notes: form.notes.trim(),
      screenshot_url: form.screenshots && form.screenshots.length > 0 ? form.screenshots.join(',') : null
    }

    const { error } = await supabase
      .from('trades')
      .update(updateData)
      .eq('id', id)

    if (error) {
      console.error('Error updating trade:', error)
      return
    }

    setTrades(prev => prev.map(t =>
      t.id === id
        ? { 
            ...t, 
            ...updateData,
            lotSize: lots,
            entryPrice: entry,
            exitPrice: exit,
            stopLoss: sl,
            takeProfit: tp,
            pips,
            pipValue,
            profitLoss,
            manualOverride: form.manualOverride,
            riskReward: rr,
            tradeResult,
            notes: form.notes.trim(),
            screenshots: form.screenshots || []
          }
        : t
    ))
  }

  const deleteTrade = async (id) => {
    if (!user) return
    const { error } = await supabase
      .from('trades')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting trade:', error)
      return
    }
    setTrades(prev => prev.filter(t => t.id !== id))
  }

  const importTrades = async (newTrades) => {
    if (!user) return

    const tradesToInsert = newTrades.map(t => ({
      user_id: user.id,
      date: t.date,
      pair: t.pair?.toUpperCase().trim(),
      type: t.type,
      lot_size: t.lotSize,
      entry_price: t.entryPrice,
      exit_price: t.exitPrice,
      stop_loss: t.stopLoss,
      take_profit: t.takeProfit,
      pips: t.pips || 0,
      pip_value: t.pipValue || 0,
      profit_loss: t.profitLoss || 0,
      manual_override: t.manualOverride ?? true,
      risk_reward: t.riskReward || 0,
      trade_result: t.tradeResult || (t.profitLoss && t.profitLoss > 0 ? 'Win' : 'Loss'),
      notes: t.notes || 'Imported',
    }))

    const { data, error } = await supabase
      .from('trades')
      .insert(tradesToInsert)
      .select()

    if (error) {
      console.error('Error importing trades:', error)
      return
    }

    if (data) {
      const mapped = data.map(t => ({
        id: t.id,
        date: t.date,
        pair: t.pair,
        type: t.type,
        lotSize: Number(t.lot_size),
        entryPrice: Number(t.entry_price),
        exitPrice: Number(t.exit_price),
        stopLoss: t.stop_loss ? Number(t.stop_loss) : undefined,
        takeProfit: t.take_profit ? Number(t.take_profit) : undefined,
        pips: Number(t.pips),
        pipValue: Number(t.pip_value),
        profitLoss: Number(t.profit_loss),
        manualOverride: t.manual_override,
        riskReward: t.risk_reward ? Number(t.risk_reward) : 0,
        tradeResult: t.trade_result,
        notes: t.notes || '',
        createdAt: t.created_at
      }))
      setTrades(prev => [...mapped, ...prev])
    }
  }

  const clearAllTrades = async () => {
    if (!user) return
    if (window.confirm('Are you sure you want to delete ALL trades? This cannot be undone.')) {
      const { error } = await supabase
        .from('trades')
        .delete()
        .eq('user_id', user.id)

      if (error) {
        console.error('Error clearing trades:', error)
      } else {
        setTrades([])
      }
    }
  }

  const stats = useMemo(() => {
    const total = trades.length
    const winningTrades = trades.filter(t => t.profitLoss > 0)
    const losingTrades = trades.filter(t => t.profitLoss < 0)
    
    const wins = winningTrades.length
    const losses = losingTrades.length
    
    const totalProfitLoss = trades.reduce((sum, t) => sum + (t.profitLoss || 0), 0)
    const totalPips = trades.reduce((sum, t) => sum + (t.pips || 0), 0)
    
    const avgWin = wins > 0 ? winningTrades.reduce((sum, t) => sum + t.profitLoss, 0) / wins : 0
    const avgLoss = losses > 0 ? Math.abs(losingTrades.reduce((sum, t) => sum + t.profitLoss, 0) / losses) : 0
    
    const rrAvg = avgLoss > 0 ? avgWin / avgLoss : 0

    let maxPnl = 0
    let currentPnlSum = 0
    let maxDd = 0
    
    const sortedTrades = [...trades].sort((a, b) => a.date.localeCompare(b.date))
    sortedTrades.forEach(t => {
      currentPnlSum += t.profitLoss
      if (currentPnlSum > maxPnl) maxPnl = currentPnlSum
      const dd = maxPnl > 0 ? (maxPnl - currentPnlSum) / maxPnl * 100 : 0
      if (dd > maxDd) maxDd = dd
    })

    const pnlValues = trades.map(t => t.profitLoss || 0)
    const bestTrade = pnlValues.length > 0 ? Math.max(...pnlValues) : 0
    const worstTrade = pnlValues.length > 0 ? Math.min(...pnlValues) : 0

    return {
      totalTrades: total,
      wins,
      losses,
      winRate: total > 0 ? Math.round((wins / total) * 100) : 0,
      totalProfitLoss,
      totalPips,
      avgProfitLoss: total > 0 ? totalProfitLoss / total : 0,
      avgWin,
      avgLoss,
      rrAvg,
      maxDrawdown: parseFloat(maxDd.toFixed(2)),
      bestTrade,
      worstTrade
    }
  }, [trades])

  return { trades, settings, setSettings, addTrade, updateTrade, deleteTrade, importTrades, clearAllTrades, stats, loading }
}

export default useTrades
