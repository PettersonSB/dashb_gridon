// =====================================================
// Edge Function: tuya-token
// =====================================================
// COMO CRIAR/ATUALIZAR:
// 1. Vá em Supabase Dashboard > Edge Functions
// 2. Nome: tuya-token
// 3. Configure as variáveis de ambiente (Secrets) no Supabase:
//    - TUYA_CLIENT_ID: Seu Access ID da Tuya
//    - TUYA_CLIENT_SECRET: Seu Access Secret da Tuya
//    - TUYA_API_URL: URL da API (Padrão: https://openapi.tuyaus.com)
// 4. Deploy este arquivo
// =====================================================

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const TUYA_CLIENT_ID = (Deno.env.get("TUYA_CLIENT_ID") || 
                        Deno.env.get("TUYA_ACCESS_ID") || 
                        Deno.env.get("TUYA_ACCESS_KEY") || 
                        Deno.env.get("tuya_client_id") || 
                        Deno.env.get("tuya_access_id") || "").trim();

const TUYA_CLIENT_SECRET = (Deno.env.get("TUYA_CLIENT_SECRET") || 
                            Deno.env.get("TUYA_SECRET") || 
                            Deno.env.get("TUYA_ACCESS_SECRET") || 
                            Deno.env.get("TUYA_SECRET_KEY") || 
                            Deno.env.get("tuya_client_secret") || 
                            Deno.env.get("tuya_access_secret") || "").trim();

const TUYA_API_URL = (Deno.env.get("TUYA_API_URL") || 
                      Deno.env.get("tuya_api_url") || "https://openapi.tuyaus.com").trim();

// Cache de token em memória (Deno mantém o estado entre execuções mornas)
let cachedToken = "";
let tokenExpireTime = 0;

// Lista de servidores globais da Tuya para tentativa de reconexão dinâmica
const REGIONAL_URLS = [
  "https://openapi.tuyaus.com",     // América
  "https://openapi.eu.tuya.com",     // Europa
  "https://openapi.tuyacn.com",     // China
  "https://openapi.tuyain.com"      // Índia
];

let activeApiUrl = ""; // Cacheia qual endpoint obteve sucesso na sessão

async function getTuyaAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && tokenExpireTime > now + 60000) {
    return cachedToken;
  }

  // Define os endpoints a tentar, priorizando o configurado e depois os demais
  const defaultUrl = TUYA_API_URL || "https://openapi.tuyaus.com";
  const urlsToTry = activeApiUrl 
    ? [activeApiUrl, ...REGIONAL_URLS.filter(u => u !== activeApiUrl)] 
    : [defaultUrl, ...REGIONAL_URLS.filter(u => u !== defaultUrl)];

  let lastError: any = null;

  for (const url of urlsToTry) {
    const t = now.toString();
    const method = "GET";
    const path = "/v1.0/token?grant_type=1";
    const sha256Empty = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
    
    // Tuya Sign v2 algorithm for token endpoint
    const stringToSign = [
      method,
      sha256Empty,
      "", // Sem headers especiais na assinatura
      path
    ].join("\n");

    const signStr = TUYA_CLIENT_ID + t + stringToSign;
    
    // Calcular Assinatura HMAC-SHA256 para obter Token
    const key = new TextEncoder().encode(TUYA_CLIENT_SECRET);
    const data = new TextEncoder().encode(signStr);
    
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      key,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    
    const signatureBuffer = await crypto.subtle.sign("HMAC", cryptoKey, data);
    const signature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase();

    try {
      console.log(`Tentando obter token Tuya em: ${url}...`);
      const response = await fetch(`${url}/v1.0/token?grant_type=1`, {
        headers: {
          "client_id": TUYA_CLIENT_ID,
          "sign": signature,
          "t": t,
          "sign_method": "HMAC-SHA256",
        }
      });

      if (!response.ok) {
        lastError = new Error(`HTTP ${response.status}: ${await response.text()}`);
        continue;
      }

      const result = await response.json();
      if (!result.success) {
        lastError = new Error(`Tuya API error: ${JSON.stringify(result)}`);
        continue;
      }

      // Sucesso!
      cachedToken = result.result.access_token;
      tokenExpireTime = now + (result.result.expire_time * 1000);
      activeApiUrl = url;
      console.log(`Token obtido com sucesso via endpoint: ${url}`);
      return cachedToken;
    } catch (err: any) {
      lastError = err;
      console.warn(`Falha na tentativa com o endpoint ${url}:`, err.message || err);
    }
  }

  throw new Error(`Falha em todos os endpoints da Tuya. Último erro: ${lastError?.message || lastError}`);
}

async function makeTuyaRequest(path: string, accessToken: string): Promise<any> {
  const urlToUse = activeApiUrl || TUYA_API_URL || "https://openapi.tuyaus.com";
  const t = Date.now().toString();
  const method = "GET";
  
  // Tuya Sign v2 algorithm
  const sha256Empty = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"; // SHA-256 de string vazia
  const stringToSign = [
    method,
    sha256Empty,
    "", // Sem headers especiais na assinatura
    path
  ].join("\n");

  const signStr = TUYA_CLIENT_ID + accessToken + t + stringToSign;
  
  const key = new TextEncoder().encode(TUYA_CLIENT_SECRET);
  const data = new TextEncoder().encode(signStr);
  
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  const signatureBuffer = await crypto.subtle.sign("HMAC", cryptoKey, data);
  const signature = Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();

  const response = await fetch(`${urlToUse}${path}`, {
    headers: {
      "client_id": TUYA_CLIENT_ID,
      "access_token": accessToken,
      "sign": signature,
      "t": t,
      "sign_method": "HMAC-SHA256",
    }
  });

  if (!response.ok) {
    throw new Error(`Erro na chamada Tuya API: ${await response.text()}`);
  }

  return await response.json();
}

serve(async (req) => {
  // Configuração de CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
      }
    });
  }

  try {
    const bodyObj = await req.json();
    const { device_id, phase_config } = bodyObj;
    
    // DIAGNOSTIC CHECK
    const envKeys = Object.keys(Deno.env.toObject());
    if (device_id === "diagnose_env") {
      let rawProperties: any = null;
      let rawError: any = null;

      try {
        const targetId = bodyObj.target_device_id;

        if (targetId) {
          const accessToken = await getTuyaAccessToken();
          const infoData = await makeTuyaRequest(`/v1.0/devices/${targetId}`, accessToken);
          const statusData = await makeTuyaRequest(`/v1.0/devices/${targetId}/status`, accessToken);
          const specsData = await makeTuyaRequest(`/v1.0/devices/${targetId}/specifications`, accessToken);
          const funcsData = await makeTuyaRequest(`/v1.0/devices/${targetId}/functions`, accessToken);
          const shadowData = await makeTuyaRequest(`/v2.0/cloud/thing/${targetId}/shadow/properties`, accessToken);
          
          rawProperties = {
            v1_info: infoData,
            v1_status: statusData,
            v1_specifications: specsData,
            v1_functions: funcsData,
            v2_shadow: shadowData
          };
        }
      } catch (err: any) {
        rawError = err.message || String(err);
      }

      const idLen = TUYA_CLIENT_ID.length;
      const secretLen = TUYA_CLIENT_SECRET.length;
      const idSample = idLen > 6 ? `${TUYA_CLIENT_ID.slice(0, 3)}...${TUYA_CLIENT_ID.slice(-3)}` : "too short";
      const secretSample = secretLen > 6 ? `${TUYA_CLIENT_SECRET.slice(0, 3)}...${TUYA_CLIENT_SECRET.slice(-3)}` : "too short";
      return new Response(JSON.stringify({ 
        etapa: "DIAGNOSE", 
        env_keys: envKeys,
        client_id_len: idLen,
        client_id_sample: idSample,
        client_secret_len: secretLen,
        client_secret_sample: secretSample,
        api_url: TUYA_API_URL,
        raw_properties: rawProperties,
        raw_error: rawError
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    if (!device_id) {
      return new Response(JSON.stringify({ error: "Parâmetro device_id é obrigatório" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    // 1. Obter Access Token e dados do Dispositivo
    const accessToken = await getTuyaAccessToken();
    
    // Obter especificações/informações gerais do dispositivo (para saber se está online)
    const deviceInfo = await makeTuyaRequest(`/v1.0/devices/${device_id}`, accessToken);
    const isOnline = deviceInfo?.result?.online === true ? "online" : "offline";

    // Obter status/leitura de propriedades do dispositivo
    let statusData = await makeTuyaRequest(`/v1.0/devices/${device_id}/status`, accessToken);
    let properties = [];

    if (statusData.success && Array.isArray(statusData.result)) {
      properties = [...statusData.result];
    }

    // Proativamente buscar e mesclar também as Shadow Properties (v2.0)
    // Muitos medidores trifásicos reportam a telemetria completa apenas via Shadow Properties
    try {
      console.log("Buscando Shadow Properties v2.0 para mesclagem...");
      const shadowData = await makeTuyaRequest(`/v2.0/cloud/thing/${device_id}/shadow/properties`, accessToken);
      if (shadowData.success && shadowData.result && Array.isArray(shadowData.result.properties)) {
        const shadowProps = shadowData.result.properties;
        for (const sProp of shadowProps) {
          const existing = properties.find((p: any) => p.code === sProp.code);
          if (existing) {
            existing.value = sProp.value;
          } else {
            properties.push(sProp);
          }
        }
        console.log(`Mescladas ${shadowProps.length} propriedades do Shadow v2.0.`);
      }
    } catch (shadowErr: any) {
      console.warn("Erro ao mesclar Shadow Properties:", shadowErr.message || shadowErr);
    }

    if (properties.length === 0) {
      return new Response(JSON.stringify({ error: "Falha ao obter status do dispositivo", details: statusData }), {
        status: 500,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    const propsMap = new Map(properties.map((p: any) => [p.code, p.value]));

    // ==========================================
    // PARSER DE TELEMETRIA MULTI-FASE / CANAL
    // ==========================================
    
    // 1. Identificar Canais / Fases disponíveis
    const phases: any = {};
    
    // Fase A / Canal 1
    const hasA = propsMap.has("voltage_a") || propsMap.has("current_a") || propsMap.has("power_a") || propsMap.has("forward_energy_a") || propsMap.has("forward_energy_1") || propsMap.has("energy_forword_a");
    if (hasA) {
      // Prioridade para voltagem específica da fase A, fallback para cur_voltage (geral)
      const vVal = propsMap.get("voltage_a") ?? propsMap.get("cur_voltage");
      const v = vVal != null ? (vVal as number) / 10 : null;
      const c = propsMap.has("current_a") ? (propsMap.get("current_a") as number) / 1000 : null;
      const p = propsMap.has("power_a") ? (propsMap.get("power_a") as number) / 10 : null;
      const fwd = propsMap.get("forward_energy_a") ?? propsMap.get("forward_energy_1") ?? propsMap.get("energy_forword_a");
      const rev = propsMap.get("reverse_energy_a") ?? propsMap.get("reverse_energy_1") ?? propsMap.get("energy_reverse_a");
      const pf = propsMap.get("power_factor_a") ?? propsMap.get("power_factor"); // Se só tem 1 fase, power_factor pode ser geral
      
      phases.a = {
        voltage: v,
        current: c,
        power: p,
        forward_energy: fwd != null ? (fwd as number) / 100 : null,
        reverse_energy: rev != null ? (rev as number) / 100 : null,
        power_factor: pf != null ? (pf as number) / 100 : null,
      };
    }

    // Fase B / Canal 2
    const hasB = propsMap.has("voltage_b") || propsMap.has("current_b") || propsMap.has("power_b") || propsMap.has("forward_energy_b") || propsMap.has("forward_energy_2") || propsMap.has("energy_forword_b");
    if (hasB) {
      const vVal = propsMap.get("voltage_b") ?? propsMap.get("cur_voltage");
      const v = vVal != null ? (vVal as number) / 10 : null;
      const c = propsMap.has("current_b") ? (propsMap.get("current_b") as number) / 1000 : null;
      const p = propsMap.has("power_b") ? (propsMap.get("power_b") as number) / 10 : null;
      const fwd = propsMap.get("forward_energy_b") ?? propsMap.get("forward_energy_2") ?? propsMap.get("energy_forword_b");
      const rev = propsMap.get("reverse_energy_b") ?? propsMap.get("reverse_energy_2") ?? propsMap.get("energy_reserse_b");
      const pf = propsMap.get("power_factor_b");
      
      phases.b = {
        voltage: v,
        current: c,
        power: p,
        forward_energy: fwd != null ? (fwd as number) / 100 : null,
        reverse_energy: rev != null ? (rev as number) / 100 : null,
        power_factor: pf != null ? (pf as number) / 100 : null,
      };
    }

    // Fase C / Canal 3
    const hasC = propsMap.has("voltage_c") || propsMap.has("current_c") || propsMap.has("power_c") || propsMap.has("forward_energy_c") || propsMap.has("forward_energy_3");
    if (hasC) {
      const vVal = propsMap.get("voltage_c") ?? propsMap.get("cur_voltage");
      const v = vVal != null ? (vVal as number) / 10 : null;
      const c = propsMap.has("current_c") ? (propsMap.get("current_c") as number) / 1000 : null;
      const p = propsMap.has("power_c") ? (propsMap.get("power_c") as number) / 10 : null;
      const fwd = propsMap.get("forward_energy_c") ?? propsMap.get("forward_energy_3");
      const rev = propsMap.get("reverse_energy_c") ?? propsMap.get("reverse_energy_3");
      const pf = propsMap.get("power_factor_c");
      
      phases.c = {
        voltage: v,
        current: c,
        power: p,
        forward_energy: fwd != null ? (fwd as number) / 100 : null,
        reverse_energy: rev != null ? (rev as number) / 100 : null,
        power_factor: pf != null ? (pf as number) / 100 : null,
      };
    }

    // 2. Extrair Totais Globais
    const rawFwdTotal = propsMap.get("forward_energy_total");
    const rawRevTotal = propsMap.get("reverse_energy_total");
    const forward_energy_total = rawFwdTotal != null ? (rawFwdTotal as number) / 100 : null;
    const reverse_energy_total = rawRevTotal != null ? (rawRevTotal as number) / 100 : null;
    
    // Potência Total: usar power_total ou total_power da Tuya, ou somar os canais
    let total_power: number | null = null;
    const rawTotalPower = propsMap.get("total_power") ?? propsMap.get("power_total");
    if (rawTotalPower != null) {
      total_power = (rawTotalPower as number) / 10;
    } else {
      // Se não veio explícito, soma as potências das fases/canais que existem
      let sum = 0;
      let hasPower = false;
      for (const key in phases) {
        if (phases[key].power != null) {
          sum += phases[key].power;
          hasPower = true;
        }
      }
      total_power = hasPower ? sum : null;
    }

    // APLICAR CONFIGURAÇÃO DINÂMICA DE TCS/FASES SE EXISTIR
    let hasCustomMapping = false;
    let dynamicGenPower = 0;
    let dynamicConPower = 0;

    if (phase_config && typeof phase_config === 'object') {
      const cfg = phase_config as any;
      hasCustomMapping = true;
      
      // Fase A
      if (phases.a && cfg.a) {
        const p = phases.a.power ?? 0;
        if (cfg.a === 'generation') {
          dynamicGenPower += Math.abs(p);
        } else if (cfg.a === 'consumption') {
          dynamicConPower += Math.abs(p);
        }
      }
      
      // Fase B
      if (phases.b && cfg.b) {
        const p = phases.b.power ?? 0;
        if (cfg.b === 'generation') {
          dynamicGenPower += Math.abs(p);
        } else if (cfg.b === 'consumption') {
          dynamicConPower += Math.abs(p);
        }
      }
      
      // Fase C
      if (phases.c && cfg.c) {
        const p = phases.c.power ?? 0;
        if (cfg.c === 'generation') {
          dynamicGenPower += Math.abs(p);
        } else if (cfg.c === 'consumption') {
          dynamicConPower += Math.abs(p);
        }
      }
    }

    const freq = propsMap.has("freq") ? (propsMap.get("freq") as number) / 100 : null;
    const temp = propsMap.has("temp_current") ? (propsMap.get("temp_current") as number) / 10 : null;
    const pfGlobal = propsMap.has("power_factor") ? (propsMap.get("power_factor") as number) / 100 : null;

    const telemetry_data = {
      total_power: hasCustomMapping ? (dynamicGenPower - dynamicConPower) : total_power,
      forward_energy_total,
      reverse_energy_total,
      frequency: freq,
      temperature: temp,
      power_factor: pfGlobal,
      phases: Object.keys(phases).length > 0 ? phases : null,
      phase_config: phase_config || null
    };

    // ==========================================
    // NORMALIZAÇÃO DE CAMPOS LEGADOS (COMPATIBILIDADE)
    // ==========================================
    
    // 1. Tensão Legada: usa cur_voltage, ou do canal A, ou média das tensões
    let legacyVoltage = null;
    if (propsMap.has("cur_voltage")) {
      legacyVoltage = (propsMap.get("cur_voltage") as number) / 10;
    } else if (phases.a?.voltage != null) {
      legacyVoltage = phases.a.voltage;
    }

    // 2. Corrente Legada: soma das correntes
    let legacyCurrent = null;
    let currentSum = 0;
    let hasCurrent = false;
    for (const key in phases) {
      if (phases[key].current != null) {
        currentSum += phases[key].current;
        hasCurrent = true;
      }
    }
    legacyCurrent = hasCurrent ? currentSum : null;

    // 3. Potência Legada: saldo líquido da potência
    const legacyPower = hasCustomMapping ? (dynamicGenPower - dynamicConPower) : total_power;

    // 4. isOn (Inversor Ativo): lê o switch geral, switch_1 ou se está gerando potência
    let legacyIsOn = true;
    if (propsMap.has("switch")) {
      legacyIsOn = propsMap.get("switch") === true;
    } else if (propsMap.has("switch_1")) {
      legacyIsOn = propsMap.get("switch_1") === true;
    } else if (legacyPower != null) {
      // Se tiver gerando potência ativa (> 5W), considera ligado
      legacyIsOn = Math.abs(legacyPower) > 5;
    }

    const responseBody = {
      etapa: "SUCESSO",
      voltage: legacyVoltage,
      current: legacyCurrent,
      power: legacyPower,
      isOn: legacyIsOn,
      online: isOnline,
      telemetry_data,
      raw_properties: properties,
    };

    return new Response(JSON.stringify(responseBody), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      }
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || String(err) }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      }
    });
  }
});
