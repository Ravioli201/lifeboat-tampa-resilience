import { useState, useEffect, useRef } from "react";
import {
  Navigation, AlertTriangle, CheckCircle, Heart, MapPin,
  Phone, Send, RefreshCw, Clock, X, ChevronRight, ChevronDown,
  ExternalLink, Plane, Search, Hotel, CloudRain, Wind,
  Thermometer, Bell, Loader, Key, Eye, EyeOff,
  ShieldCheck, Trash2, MapPinOff, Shield, Activity
} from "lucide-react";

// ── THEME ────────────────────────────────────────────────────────────────────
const C = {
  bg:"#060e1a", bg2:"#0a1628", bg3:"#0d1e35",
  border:"#112240", borderLt:"#1a3558",
  cyan:"#22d3ee", cyanDim:"#0891b2", cyanFaint:"#083344",
  teal:"#2dd4bf", sage:"#34d399", amber:"#fbbf24", red:"#f87171",
  textPri:"#e2f4fb", textSec:"#7fb8cc", textMute:"#3d6880",
};

// ── HISTORICAL BRAIN ─────────────────────────────────────────────────────────
// Helene surge record: 6.04ft @ Port Manatee | Milton flash flood: 10in Tampa/Lutz
const THRESHOLDS = { SURGE: 6.04, SAFE_BUFFER: 3.0, SAFE_ELEV: 15.0 };

function calcSafety(elevFt) {
  if (elevFt == null) return null;
  const margin = elevFt - (THRESHOLDS.SURGE + THRESHOLDS.SAFE_BUFFER);
  return { margin, status: margin > 6 ? "safe" : margin > 0 ? "caution" : "critical" };
}

// ── HELPERS ──────────────────────────────────────────────────────────────────
const timeStr = (d = new Date()) =>
  d.toLocaleTimeString("en-US", { hour:"2-digit", minute:"2-digit", hour12:true });
const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
};
const haversine = (lat1,lon1,lat2,lon2) => {
  const R=3958.8, dLat=(lat2-lat1)*Math.PI/180, dLon=(lon2-lon1)*Math.PI/180;
  const a=Math.sin(dLat/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
};

// ── GEOCODER — US Nationwide ──────────────────────────────────────────────────
// Layer 1: FL instant cache (zero network)
// Layer 2: Zippopotam.us  — 42k US ZIPs, CORS-enabled, no key
// Layer 3: Photon (komoot) — full US city search, CORS-safe, no key
// RULE: No custom headers on any fetch call — triggers CORS preflight failures.

const FL_CACHE = {
  "33548":"Lutz,FL,28.1728,-82.4585","33549":"Lutz,FL,28.1867,-82.4604","33558":"Lutz,FL,28.1478,-82.5143",
  "33601":"Tampa,FL,27.9477,-82.4583","33602":"Tampa,FL,27.9506,-82.4572","33603":"Tampa,FL,27.9748,-82.4604",
  "33604":"Tampa,FL,28.0003,-82.4585","33605":"Tampa,FL,27.9584,-82.4326","33606":"Tampa,FL,27.9367,-82.4694",
  "33607":"Tampa,FL,27.9634,-82.5032","33609":"Tampa,FL,27.9459,-82.5137","33610":"Tampa,FL,27.9975,-82.3932",
  "33611":"Tampa,FL,27.8976,-82.5026","33612":"Tampa,FL,28.0572,-82.4382","33613":"Tampa,FL,28.0825,-82.4388",
  "33614":"Tampa,FL,28.0049,-82.5026","33615":"Tampa,FL,28.0078,-82.5706","33617":"Tampa,FL,28.0447,-82.3932",
  "33618":"Tampa,FL,28.0572,-82.4916","33619":"Tampa,FL,27.9306,-82.3788","33624":"Carrollwood,FL,28.0800,-82.5293",
  "33625":"Citrus Park,FL,28.0591,-82.5706","33626":"Westchase,FL,28.0513,-82.6215",
  "33629":"South Tampa,FL,27.9228,-82.5026","33647":"New Tampa,FL,28.1319,-82.3543",
  "34637":"Land O' Lakes,FL,28.2614,-82.5174","34638":"Land O' Lakes,FL,28.2294,-82.5504",
  "34639":"Land O' Lakes,FL,28.2156,-82.4694",
  "33755":"Clearwater,FL,27.9667,-82.8012","33759":"Clearwater,FL,27.9791,-82.7373",
  "33760":"Clearwater,FL,27.9019,-82.7098","33761":"Clearwater,FL,28.0225,-82.7373",
  "33801":"Lakeland,FL,28.0395,-81.9498","33803":"Lakeland,FL,27.9863,-81.9553",
  "34471":"Ocala,FL,29.1869,-82.1401","34472":"Ocala,FL,29.1508,-82.0751",
  "34474":"Ocala,FL,29.2019,-82.1731","34476":"Ocala,FL,29.1297,-82.1731",
  "32801":"Orlando,FL,28.5472,-81.3789","32803":"Orlando,FL,28.5608,-81.3569",
  "32819":"Orlando,FL,28.4747,-81.4779","32836":"Orlando,FL,28.4308,-81.5109",
  "34741":"Kissimmee,FL,28.2942,-81.4119","34743":"Kissimmee,FL,28.2792,-81.3569",
  "32202":"Jacksonville,FL,30.3275,-81.6594","32205":"Jacksonville,FL,30.3039,-81.7254",
  "32216":"Jacksonville,FL,30.2717,-81.5764","32218":"Jacksonville,FL,30.4039,-81.6374",
  "32250":"Jacksonville Beach,FL,30.2817,-81.4554",
  "33101":"Miami,FL,25.7743,-80.1937","33130":"Miami,FL,25.7636,-80.2017",
  "33139":"Miami Beach,FL,25.7836,-80.1337","33140":"Miami Beach,FL,25.8053,-80.1337",
  "33301":"Fort Lauderdale,FL,26.1220,-80.1444","33304":"Fort Lauderdale,FL,26.1267,-80.1224",
  "33401":"West Palm Beach,FL,26.7153,-80.0534","33410":"Palm Beach Gardens,FL,26.8319,-80.0864",
  "33486":"Boca Raton,FL,26.3547,-80.0864","33426":"Boynton Beach,FL,26.6253,-80.0754",
  "33901":"Fort Myers,FL,26.6417,-81.8723","33907":"Fort Myers,FL,26.5783,-81.8723",
  "34101":"Naples,FL,26.1422,-81.7953","34102":"Naples,FL,26.1394,-81.7953",
  "34201":"Bradenton,FL,27.4808,-82.5237","34205":"Bradenton,FL,27.4983,-82.5749",
  "34231":"Sarasota,FL,27.2706,-82.5199","34232":"Sarasota,FL,27.3342,-82.4694",
  "34652":"New Port Richey,FL,28.2442,-82.7248","34683":"Palm Harbor,FL,28.0786,-82.7648",
  "34689":"Tarpon Springs,FL,28.1461,-82.7538","34698":"Dunedin,FL,28.0272,-82.7648",
  "33880":"Winter Haven,FL,28.0058,-81.7338","34606":"Spring Hill,FL,28.4958,-82.5174",
  "34601":"Brooksville,FL,28.5553,-82.4584",
  "33702":"St. Petersburg,FL,27.8533,-82.6437","33703":"St. Petersburg,FL,27.8225,-82.6437",
  "33704":"St. Petersburg,FL,27.8064,-82.6326","33710":"St. Petersburg,FL,27.7936,-82.6991",
  "32082":"Ponte Vedra Beach,FL,30.0919,-81.3899","32084":"St. Augustine,FL,29.8928,-81.3129",
  "32117":"Daytona Beach,FL,29.2242,-81.0569","32127":"Port Orange,FL,29.1175,-80.9789",
  "32137":"Palm Coast,FL,29.5764,-81.2369","32725":"Deltona,FL,28.9086,-81.2149",
  "32746":"Lake Mary,FL,28.7514,-81.3239","32765":"Oviedo,FL,28.6858,-81.2259",
  "32771":"Sanford,FL,28.8117,-81.2699","32789":"Winter Park,FL,28.5989,-81.3569",
  "32714":"Altamonte Springs,FL,28.6414,-81.4009","32703":"Apopka,FL,28.6636,-81.5549",
  "32935":"Melbourne,FL,28.1044,-80.6389","32960":"Vero Beach,FL,27.6386,-80.3973",
  "33950":"Punta Gorda,FL,26.9317,-82.0448","33980":"Port Charlotte,FL,26.9764,-82.0909",
  "34135":"Bonita Springs,FL,26.3469,-81.7943","34609":"Spring Hill,FL,28.4764,-82.5724",
};

const FL_NAMES = {
  "lutz":[28.1728,-82.4585],"land o lakes":[28.2156,-82.4694],"land o' lakes":[28.2156,-82.4694],
  "tampa":[27.9477,-82.4583],"st pete":[27.7676,-82.6403],"st. pete":[27.7676,-82.6403],
  "st. petersburg":[27.7676,-82.6403],"saint petersburg":[27.7676,-82.6403],
  "clearwater":[27.9659,-82.8001],"brandon":[27.9378,-82.2859],"riverview":[27.8661,-82.3282],
  "wesley chapel":[28.2336,-82.3294],"new tampa":[28.1319,-82.3543],"carrollwood":[28.0572,-82.5032],
  "odessa":[28.1817,-82.5921],"spring hill":[28.4764,-82.5724],"brooksville":[28.5553,-82.4584],
  "lakeland":[28.0395,-81.9498],"winter haven":[28.0225,-81.7338],"plant city":[28.0189,-82.1150],
  "orlando":[28.5383,-81.3792],"kissimmee":[28.2942,-81.4079],"winter park":[28.5989,-81.3569],
  "altamonte springs":[28.6614,-81.3955],"apopka":[28.6936,-81.5323],"oviedo":[28.6714,-81.2086],
  "sanford":[28.8108,-81.2734],"lake mary":[28.7514,-81.3239],"longwood":[28.7014,-81.3459],
  "ocala":[29.1869,-82.1401],"gainesville":[29.6516,-82.3248],
  "jacksonville":[30.3322,-81.6557],"jax":[30.3322,-81.6557],
  "st augustine":[29.8947,-81.3145],"st. augustine":[29.8947,-81.3145],
  "ponte vedra":[30.2478,-81.3899],"daytona beach":[29.2108,-81.0228],"daytona":[29.2108,-81.0228],
  "port orange":[29.1178,-81.0009],"ormond beach":[29.2861,-81.0559],"palm coast":[29.5844,-81.2079],
  "deltona":[28.9019,-81.2139],"deland":[28.9983,-81.3029],
  "miami":[25.7743,-80.1937],"miami beach":[25.7903,-80.1300],"hialeah":[25.8578,-80.2784],
  "fort lauderdale":[26.1224,-80.1373],"ft lauderdale":[26.1224,-80.1373],
  "boca raton":[26.3683,-80.1289],"delray beach":[26.4615,-80.0728],
  "west palm beach":[26.7153,-80.0534],"wpb":[26.7153,-80.0534],
  "palm beach gardens":[26.8228,-80.0923],"jupiter":[26.9342,-80.0940],
  "port st lucie":[27.2939,-80.3503],"vero beach":[27.6386,-80.3973],
  "melbourne":[28.0836,-80.6081],"titusville":[28.6122,-80.8077],
  "fort myers":[26.6406,-81.8723],"ft myers":[26.6406,-81.8723],"cape coral":[26.5628,-81.9495],
  "naples":[26.1422,-81.7953],"bonita springs":[26.3397,-81.7787],
  "sarasota":[27.3364,-82.5307],"bradenton":[27.4989,-82.5748],"venice":[27.0998,-82.4543],
  "punta gorda":[26.9317,-82.0448],"port charlotte":[26.9764,-82.0909],
  "new port richey":[28.2442,-82.7248],"palm harbor":[28.0786,-82.7648],
  "tarpon springs":[28.1461,-82.7538],"dunedin":[28.0272,-82.7648],
  "safety harbor":[28.0022,-82.7098],"trinity":[28.2128,-82.6658],
  "tallahassee":[30.4383,-84.2807],"pensacola":[30.4213,-87.2169],
  "panama city":[30.1588,-85.6602],"destin":[30.3935,-86.4958],"key west":[24.5551,-81.7800],
  // Major US cities
  "new york":[40.7128,-74.0060],"nyc":[40.7128,-74.0060],"new york city":[40.7128,-74.0060],
  "los angeles":[34.0522,-118.2437],"la":[34.0522,-118.2437],"chicago":[41.8781,-87.6298],
  "houston":[29.7604,-95.3698],"phoenix":[33.4484,-112.0740],"philadelphia":[39.9526,-75.1652],
  "san antonio":[29.4241,-98.4936],"san diego":[32.7157,-117.1611],"dallas":[32.7767,-96.7970],
  "austin":[30.2672,-97.7431],"fort worth":[32.7555,-97.3308],"columbus":[39.9612,-82.9988],
  "charlotte":[35.2271,-80.8431],"atlanta":[33.7490,-84.3880],"seattle":[47.6062,-122.3321],
  "denver":[39.7392,-104.9903],"boston":[42.3601,-71.0589],
  "washington dc":[38.9072,-77.0369],"dc":[38.9072,-77.0369],"washington":[38.9072,-77.0369],
  "nashville":[36.1627,-86.7816],"baltimore":[39.2904,-76.6122],"louisville":[38.2527,-85.7585],
  "portland":[45.5051,-122.6750],"las vegas":[36.1699,-115.1398],"memphis":[35.1495,-90.0490],
};

async function geocodeLocation(query) {
  const raw = query.trim();
  const q = raw.toLowerCase().replace(/[.,]/g,"").replace(/\s+/g," ");

  // Layer 1a — FL ZIP instant cache
  if (/^\d{5}$/.test(raw) && FL_CACHE[raw]) {
    const [city, state, lat, lon] = FL_CACHE[raw].split(",");
    return { lat:+lat, lon:+lon, label:`${city}, ${state}` };
  }

  // Layer 1b — city name instant cache
  const stripped = q.replace(/,?\s*(fl|florida|usa|us|united states)$/,"").trim();
  if (FL_NAMES[stripped]) {
    const [lat,lon] = FL_NAMES[stripped];
    return { lat, lon, label: raw };
  }
  const partial = Object.keys(FL_NAMES).find(k => stripped.startsWith(k) || k.startsWith(stripped));
  if (partial) return { lat:FL_NAMES[partial][0], lon:FL_NAMES[partial][1], label:raw };

  // Layer 2 — Zippopotam.us: every US ZIP, explicit CORS, no key
  if (/^\d{5}$/.test(raw)) {
    try {
      const r = await fetch(`https://api.zippopotam.us/us/${raw}`);
      if (r.ok) {
        const d = await r.json();
        const p = d.places?.[0];
        if (p) return { lat:+p.latitude, lon:+p.longitude, label:`${p["place name"]}, ${p["state abbreviation"]}` };
      }
    } catch {}
  }

  // Layer 3 — Photon (komoot): full US geocoding, CORS-safe, no key
  try {
    const r = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(raw)}&limit=1&lang=en`);
    if (r.ok) {
      const d = await r.json();
      const f = d?.features?.[0];
      if (f) {
        const p = f.properties || {};
        return {
          lat: f.geometry.coordinates[1],
          lon: f.geometry.coordinates[0],
          label: [p.city||p.name, p.state||p.country].filter(Boolean).join(", "),
        };
      }
    }
  } catch {}
  return null;
}

// ── NWS APIs (no custom headers — api.weather.gov supports CORS natively) ────
async function fetchNWSAlerts(lat, lon) {
  try {
    const r = await fetch(`https://api.weather.gov/alerts/active?point=${lat.toFixed(4)},${lon.toFixed(4)}&limit=10`);
    if (!r.ok) throw new Error();
    const d = await r.json();
    return (d.features||[]).map(f => ({
      id:f.id, event:f.properties.event, headline:f.properties.headline,
      description:f.properties.description, expires:f.properties.expires,
      instruction:f.properties.instruction,
    }));
  } catch { return []; }
}

async function fetchNWSConditions(lat, lon) {
  try {
    const ptR = await fetch(`https://api.weather.gov/points/${lat.toFixed(4)},${lon.toFixed(4)}`);
    if (!ptR.ok) throw new Error();
    const pt = await ptR.json();
    const stR = await fetch(pt.properties?.observationStations);
    const st = await stR.json();
    const sid = st.features?.[0]?.properties?.stationIdentifier;
    if (!sid) throw new Error();
    const obsR = await fetch(`https://api.weather.gov/stations/${sid}/observations/latest`);
    const obs = await obsR.json();
    const p = obs.properties;
    return {
      temp: p.temperature?.value != null ? Math.round(p.temperature.value*9/5+32) : null,
      windSpeed: p.windSpeed?.value != null ? Math.round(p.windSpeed.value*0.621371) : null,
      description: p.textDescription,
      humidity: p.relativeHumidity?.value != null ? Math.round(p.relativeHumidity.value) : null,
      barometric: p.barometricPressure?.value != null ? Math.round(p.barometricPressure.value/100) : null,
      station: sid,
      city: pt.properties?.relativeLocation?.properties?.city,
      state: pt.properties?.relativeLocation?.properties?.state,
    };
  } catch { return null; }
}

async function fetchElevation(lat, lon) {
  try {
    const r = await fetch(`https://api.open-elevation.com/api/v1/lookup?locations=${lat},${lon}`);
    if (!r.ok) throw new Error();
    const d = await r.json();
    return (d.results?.[0]?.elevation ?? null); // metres
  } catch {
    try {
      const r2 = await fetch(`https://epqs.nationalmap.gov/v1/json?x=${lon}&y=${lat}&units=Feet&includeDate=false`);
      const d2 = await r2.json();
      const v = parseFloat(d2.value);
      return isNaN(v) ? null : v * 0.3048;
    } catch { return null; }
  }
}

function alertPriority(e="") {
  const ev = e.toLowerCase();
  if (["tornado","hurricane","storm surge","flash flood","extreme wind","tsunami"].some(s=>ev.includes(s))) return "red";
  if (ev.includes("watch")||ev.includes("warning")||ev.includes("advisory")) return "amber";
  return "blue";
}

// ── STATIC DATA ───────────────────────────────────────────────────────────────
const SHELTERS = [
  {id:"s1",name:"Sunlake High School",       city:"Land O'Lakes",elevation:42, capacity:1200,reserved:353, lat:28.190,lon:-82.460,amenities:["Pets OK","AC","Medical"]},
  {id:"s2",name:"Wiregrass Ranch HS",         city:"Wesley Chapel",elevation:55, capacity:800, reserved:188, lat:28.248,lon:-82.351,amenities:["AC","Medical","WiFi"]},
  {id:"s3",name:"College of Central Florida", city:"Ocala",        elevation:112,capacity:1000,reserved:20,  lat:29.192,lon:-82.130,amenities:["AC","WiFi","Showers"]},
  {id:"s4",name:"Lakeland Civic Center",      city:"Lakeland",     elevation:210,capacity:1000,reserved:50,  lat:28.041,lon:-81.953,amenities:["AC","Medical","WiFi"]},
  {id:"s5",name:"Orange Co. Convention Ctr",  city:"Orlando",      elevation:94, capacity:8000,reserved:1800,lat:28.424,lon:-81.470,amenities:["AC","Medical","Childcare"]},
  {id:"s6",name:"Jacksonville Fairgrounds",   city:"Jacksonville", elevation:28, capacity:3000,reserved:400, lat:30.330,lon:-81.660,amenities:["AC","Medical","WiFi","Pets OK"]},
];

const AMENITY_ICONS = {"Pets OK":"🐾","AC":"❄️","Medical":"🏥","WiFi":"📶","Showers":"🚿","Childcare":"👶"};

const FL_QUICK = [
  {zip:"33548",label:"Lutz"},{zip:"33601",label:"Tampa"},
  {zip:"32801",label:"Orlando"},{zip:"34471",label:"Ocala"},
  {zip:"33801",label:"Lakeland"},{zip:"32202",label:"Jacksonville"},
];

const inp = {
  background:C.bg3, border:`1px solid ${C.borderLt}`, borderRadius:14,
  padding:"10px 14px", fontSize:13, color:C.textPri, outline:"none",
  width:"100%", boxSizing:"border-box",
};

// ── APP ───────────────────────────────────────────────────────────────────────
export default function Lifeboat() {
  // Identity
  const [userName,    setUserName]    = useState(()=>localStorage.getItem("lb_name")||"");
  const [nameInput,   setNameInput]   = useState("");
  const [onboarded,   setOnboarded]   = useState(()=>!!localStorage.getItem("lb_name"));

  // API key
  const [apiKey,      setApiKey]      = useState(()=>localStorage.getItem("lb_apikey")||"");
  const [keyInput,    setKeyInput]    = useState("");
  const [showKey,     setShowKey]     = useState(false);
  const [keyValid,    setKeyValid]    = useState(()=>!!localStorage.getItem("lb_apikey"));
  const [keyError,    setKeyError]    = useState("");
  const [keyTesting,  setKeyTesting]  = useState(false);
  const [showKeyPanel,setShowKeyPanel]= useState(false);

  // Location
  const [location,     setLocation]     = useState(null);
  const [elevation,    setElevation]    = useState(null); // metres
  const [locLoading,   setLocLoading]   = useState(false);
  const [locError,     setLocError]     = useState(null);
  const [showManual,   setShowManual]   = useState(false);
  const [manualInput,  setManualInput]  = useState("");
  const [manualLoading,setManualLoading]= useState(false);
  const [manualError,  setManualError]  = useState("");

  // Weather
  const [conditions,    setConditions]    = useState(null);
  const [alerts,        setAlerts]        = useState([]);
  const [weatherLoading,setWeatherLoading]= useState(false);
  const [lastRefresh,   setLastRefresh]   = useState(null);
  const [alertExpanded, setAlertExpanded] = useState(null);

  // UI
  const [tab,   setTab]   = useState("home");
  const [time,  setTime]  = useState(new Date());
  const [toast, setToast] = useState(null);

  // Shelter
  const [shelterSearch, setShelterSearch] = useState("");
  const [reserving,     setReserving]     = useState(null);
  const [reserveForm,   setReserveForm]   = useState({name:"",people:1,pets:false,medical:false});
  const [confirmed,     setConfirmed]     = useState([]);
  const [shelters,      setShelters]      = useState(SHELTERS);

  // Chat
  const [chatOpen,    setChatOpen]    = useState(false);
  const [messages,    setMessages]    = useState([]);
  const [chatInput,   setChatInput]   = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  // SOS
  const [sosList, setSosList] = useState([
    {id:1,name:"Maria T.",   location:"Lutz, CR-41",  elevation:3.2, need:"Rising water at front door",           priority:"red",   time:"2m ago", category:"flood"},
    {id:2,name:"Darnell R.", location:"Land O' Lakes",elevation:4.1, need:"Elderly neighbor needs transport",     priority:"red",   time:"5m ago", category:"medical"},
    {id:3,name:"Priya K.",   location:"Wesley Chapel",elevation:9.8, need:"Generator fuel — insulin pump backup", priority:"red",   time:"8m ago", category:"medical"},
    {id:4,name:"Tom G.",     location:"New Tampa",    elevation:11.2,need:"SR-56 westbound flooded",              priority:"yellow",time:"12m ago",category:"road"},
  ]);
  const [sosOpen,  setSosOpen]  = useState(false);
  const [sosInput, setSosInput] = useState({name:"",need:"",category:"flood"});

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  useEffect(()=>{
    const t=setInterval(()=>setTime(new Date()),1000);
    return()=>clearInterval(t);
  },[]);
  
  useEffect(()=>{
    try{
      if(chatEndRef?.current){
        chatEndRef.current.scrollIntoView({behavior:"smooth"});
      }
    }catch(err){
      console.error("[LIFEBOAT] Chat scroll error:",err);
    }
  },[messages]);
  
  useEffect(()=>{
    if(onboarded&&!location){
      requestGPS();
    }
  },[onboarded,location]);
  
  useEffect(()=>{
    if(!location?.lat||!location?.lon)return;
    let isMounted=true;
    let weatherInterval=null;
    
    const loadAndSchedule=async()=>{
      if(!isMounted)return;
      try{
        await loadWeather(location.lat,location.lon);
        if(isMounted){
          weatherInterval=setInterval(()=>{
            if(isMounted){
              loadWeather(location.lat,location.lon).catch(e=>console.error("[LIFEBOAT] Weather interval error:",e));
            }
          },5*60*1000);
        }
      }catch(err){
        console.error("[LIFEBOAT] Initial weather load:",err);
      }
    };
    
    loadAndSchedule();
    
    return()=>{
      isMounted=false;
      if(weatherInterval)clearInterval(weatherInterval);
    };
  },[location?.lat,location?.lon]);

  // ── Memory leak prevention ────────────────────────────────────────────────
  const autoSearchTimeout = useRef(null);
  const geoLocationTimeout = useRef(null);
  
  // ── Cleanup on unmount ────────────────────────────────────────────────────────
  useEffect(()=>{
    return()=>{
      if(autoSearchTimeout.current)clearTimeout(autoSearchTimeout.current);
      if(geoLocationTimeout.current)clearTimeout(geoLocationTimeout.current);
    };
  },[]);

  // ── Auto-search manual input (real-time as user types) ──────────────────────
  useEffect(()=>{
    if(!manualInput?.trim()||!showManual){
      setManualError("");
      return;
    }
    // Clear previous timeout
    if(autoSearchTimeout.current)clearTimeout(autoSearchTimeout.current);
    // Debounce: wait 800ms before searching
    autoSearchTimeout.current=setTimeout(async()=>{
      try{
        setManualLoading(true);
        setManualError("");
        const result=await geocodeLocation(manualInput?.trim());
        if(result){
          setLocation({lat:result.lat,lon:result.lon,source:"manual",label:result.label,accuracy:null});
          fetchElevation(result.lat,result.lon).then(e=>e!==undefined&&setElevation(e)).catch(()=>setElevation(null));
          notify(`📍 Location updated to ${result.label}`);
        }else{
          setManualError("Location not found. Try a ZIP code like 33548 or 'Tampa, FL'.");
        }
      }catch(err){
        setManualError("Search error. Please try again.");
      }finally{
        setManualLoading(false);
      }
    },800);
    return()=>{if(autoSearchTimeout.current)clearTimeout(autoSearchTimeout.current);};
  },[manualInput,showManual]);

  // ── Actions ────────────────────────────────────────────────────────────────
  function submitName() {
    const n=nameInput.trim(); if(!n)return;
    localStorage.setItem("lb_name",n); setUserName(n); setOnboarded(true);
  }

  function requestGPS() {
    setLocLoading(true);
    setLocError(null);
    setShowManual(false);
    
    if (!navigator?.geolocation) {
      console.warn("[LIFEBOAT] Geolocation not supported");
      setDefaultLocationLutz("Geolocation not supported. Defaulting to Lutz, FL.");
      return;
    }
    
    // Clear any pending timeout
    if(geoLocationTimeout.current)clearTimeout(geoLocationTimeout.current);
    
    // 5-SECOND HARD TIMEOUT — Fail-safe to prevent hanging
    geoLocationTimeout.current=setTimeout(()=>{
      console.warn("[LIFEBOAT] Geolocation timeout after 5s");
      setDefaultLocationLutz("GPS timeout. Defaulting to Lutz, FL.");
      geoLocationTimeout.current=null;
    },5000);
    
    navigator.geolocation.getCurrentPosition(
      pos=>{
        try{
          if(geoLocationTimeout.current){
            clearTimeout(geoLocationTimeout.current);
            geoLocationTimeout.current=null;
          }
          const{latitude:lat,longitude:lon,accuracy}=pos?.coords||{};
          if(lat===undefined||lon===undefined){
            throw new Error("Invalid GPS coordinates");
          }
          setLocation({lat,lon,accuracy:accuracy||null,source:"gps",label:`GPS · ${lat.toFixed(4)}°N`});
          setLocLoading(false);
          fetchElevation(lat,lon)
            .then(e=>{
              if(e!==undefined)setElevation(e);
            })
            .catch(err=>{
              console.error("[LIFEBOAT] Elevation fetch error:",err);
              setElevation(null);
            });
          notify("📡 Live GPS acquired");
          console.log("[LIFEBOAT] GPS success:",{lat,lon});
        }catch(err){
          console.error("[LIFEBOAT] GPS position error:",err);
          setDefaultLocationLutz("GPS error. Defaulting to Lutz, FL.");
        }
      },
      err=>{
        try{
          if(geoLocationTimeout.current){
            clearTimeout(geoLocationTimeout.current);
            geoLocationTimeout.current=null;
          }
          console.warn("[LIFEBOAT] GPS error code:",err?.code,"message:",err?.message);
          if(err?.code===1){
            setDefaultLocationLutz("Location access denied. Defaulting to Lutz, FL.");
          }else if(err?.code===2){
            setDefaultLocationLutz("Position unavailable. Defaulting to Lutz, FL.");
          }else{
            setDefaultLocationLutz("GPS signal lost. Defaulting to Lutz, FL.");
          }
        }catch(handlerErr){
          console.error("[LIFEBOAT] GPS error handler crashed:",handlerErr);
          setDefaultLocationLutz("GPS error. Defaulting to Lutz, FL.");
        }
      },
      {enableHighAccuracy:true,timeout:5000,maximumAge:0}
    );
  }

  function setDefaultLocationLutz(reason) {
    try{
      const lat=28.1728, lon=-82.4585;
      setLocation({lat,lon,accuracy:null,source:"fallback",label:"Lutz, FL (fallback)"});
      setLocLoading(false);
      fetchElevation(lat,lon)
        .then(e=>{
          if(e!==undefined)setElevation(e);
        })
        .catch(err=>{
          console.error("[LIFEBOAT] Fallback elevation error:",err);
          setElevation(22);
        });
      notify(`⚠️ ${reason}`);
      console.log("[LIFEBOAT] Fallback activated:",reason);
    }catch(err){
      console.error("[LIFEBOAT] Fallback function error:",err);
      setLocLoading(false);
      setLocError("Critical location error. Please refresh.");
    }
  }

  function handleGPSFail(reason) {
    try{
      setLocError(reason||"GPS failed.");
      setLocLoading(false);
      setShowManual(true);
    }catch(err){
      console.error("[LIFEBOAT] handleGPSFail error:",err);
    }
  }

  async function submitManual() {
    const q=manualInput.trim(); if(!q){setManualError("Enter a ZIP or city name.");return;}
    setManualLoading(true); setManualError("");
    const result = await geocodeLocation(q);
    if(!result){
      setManualError("Location not found. Try a ZIP code like 33548 or 'Tampa, FL'.");
      setManualLoading(false); return;
    }
    setLocation({lat:result.lat,lon:result.lon,source:"manual",label:result.label,accuracy:null});
    fetchElevation(result.lat,result.lon).then(e=>setElevation(e));
    setShowManual(false); setManualInput(""); setManualError(""); setManualLoading(false);
    notify(`📍 Location set to ${result.label}`);
  }

  async function loadWeather(lat,lon) {
    try{
      if(lat===undefined||lon===undefined){
        console.warn("[LIFEBOAT] Invalid coords for weather:",{lat,lon});
        return;
      }
      setWeatherLoading(true);
      const[cond,alrt]=await Promise.all([
        fetchNWSConditions(lat,lon).catch(e=>(console.error("[LIFEBOAT] NWS conditions error:",e),null)),
        fetchNWSAlerts(lat,lon).catch(e=>(console.error("[LIFEBOAT] NWS alerts error:",e),[]))
      ]);
      if(cond||alrt){
        setConditions(cond||null);
        setAlerts(alrt||[]);
        setLastRefresh(new Date());
      }
      setWeatherLoading(false);
    }catch(err){
      console.error("[LIFEBOAT] Weather load error:",err);
      setWeatherLoading(false);
      setConditions(null);
      setAlerts([]);
    }
  }

  // ── LIVE RE-ROUTING SIMULATION ────────────────────────────────────────────
  function simulateBlockedRoad() {
    try{
      if(!location?.lat||!location?.lon){
        notify("⚠️ Set location first.");
        return;
      }
      const nearestShelter=sortedShelters?.[0];
      if(!nearestShelter){
        notify("❌ No shelters available.");
        return;
      }
      notify(`🚨 Road blocked! Rerouting to ${nearestShelter.name} (${nearestShelter.elevation}ft elevation)`);
      setLocation(prev=>({...prev,rerouted:true,targetShelter:nearestShelter.id}));
      setTab("shelter");
      console.log("[LIFEBOAT] Simulated road blockage. Reroute to:",nearestShelter.name);
    }catch(err){
      console.error("[LIFEBOAT] Simulation function error:",err);
      notify("❌ Simulation error.");
    }
  }

  async function testAndSaveKey() {
    const k=keyInput.trim();
    if(!k.startsWith("sk-ant-")){setKeyError("Key should start with sk-ant-");return;}
    setKeyTesting(true); setKeyError("");
    try{
      const r=await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",
        headers:{"Content-Type":"application/json","x-api-key":k,"anthropic-version":"2023-06-01"},
        body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:10,messages:[{role:"user",content:"hi"}]})
      });
      if(r.status===401){setKeyError("Key rejected — check you copied it correctly.");setKeyTesting(false);return;}
      localStorage.setItem("lb_apikey",k);
      setApiKey(k);setKeyValid(true);setKeyInput("");setShowKeyPanel(false);
      notify("🔆 Beacon AI activated!");
    }catch{setKeyError("Connection error.");}
    setKeyTesting(false);
  }

  function removeKey(){
    localStorage.removeItem("lb_apikey");
    setApiKey("");setKeyValid(false);setMessages([]);
    notify("API key removed.");
  }

  function confirmReservation(){
    if(!reserveForm.name)return;
    const s=shelters.find(s=>s.id===reserving);
    setShelters(prev=>prev.map(sh=>sh.id===reserving?{...sh,reserved:sh.reserved+reserveForm.people}:sh));
    const code="LB-"+Math.random().toString(36).slice(2,8).toUpperCase();
    setConfirmed(c=>[...c,{shelterId:reserving,shelterName:s.name,city:s.city,...reserveForm,confirmCode:code}]);
    setReserving(null);setReserveForm({name:"",people:1,pets:false,medical:false});
    notify(`✅ Reserved at ${s.name} · Code: ${code}`);
  }

  function notify(msg){setToast(msg);setTimeout(()=>setToast(null),4500);}

  function submitSOS(){
    if(!sosInput.name||!sosInput.need)return;
    setSosList(l=>[{id:Date.now(),...sosInput,location:location?.label||"Unknown",elevation:elevFt?.toFixed(1)||4.5,priority:"yellow",time:"just now"},...l]);
    setSosOpen(false);setSosInput({name:"",need:"",category:"flood"});
    notify("🆘 Request received. Help is on the way.");
  }

  const flightURL = dest => {
    const from=conditions?.city?encodeURIComponent(conditions?.city+" FL"):"Tampa+FL";
    return`https://www.google.com/travel/flights?q=flights+from+${from}+to+${encodeURIComponent(dest)}&curr=USD`;
  };
  const hotelURL = city => {
    const cin=new Date(Date.now()+86400000).toISOString().slice(0,10);
    const cout=new Date(Date.now()+86400000*3).toISOString().slice(0,10);
    return`https://www.google.com/travel/hotels/${encodeURIComponent(city+", FL")}?checkin=${cin}&checkout=${cout}`;
  };

  // ── Beacon chatbot ─────────────────────────────────────────────────────────
  async function sendChat(){
    const text=chatInput.trim();
    if(!text||chatLoading)return;
    if(!apiKey){setShowKeyPanel(true);setChatOpen(false);return;}
    const userMsg={role:"user",content:text};
    setMessages(m=>[...m,userMsg]);setChatInput("");setChatLoading(true);
    const locCtx=location
      ?`User location: ${location.label}. Elevation: ${elevFt!=null?elevFt.toFixed(0)+"ft":"unknown"}. City: ${conditions?.city||"unknown"}, ${conditions?.state||"FL"}.`
      :"Location unknown.";
    const alertCtx=alerts.length>0
      ?`ACTIVE NWS ALERTS:\n${alerts.slice(0,3).map(a=>`- ${a.event}: ${a.headline}`).join("\n")}`
      :"No active NWS alerts.";
    const wxCtx=conditions
      ?`Conditions: ${conditions?.description||"N/A"}, ${conditions?.temp!=null?conditions?.temp+"°F":""}, wind ${conditions?.windSpeed!=null?conditions?.windSpeed+"mph":"?"}.`
      :"Weather unavailable.";
    const system=`You are Beacon — Lifeboat's emergency AI. Calm, warm, direct. Never panic-inducing.

${locCtx}
${alertCtx}
${wxCtx}

Thresholds: Helene surge=6.04ft Port Manatee FL (2024). Milton=10in Tampa/Lutz (2024). Safe elevation=15ft+.
Safety margin: ${safety?safety.margin.toFixed(1)+"ft ("+safety.status+")":"unknown"}.

Always address user as ${userName}. Be specific and actionable. 2-4 sentences unless detail requested.
For evacuation: step-by-step. If immediate danger: end with "If you are in immediate danger, call 911."`;
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",
        headers:{"Content-Type":"application/json","x-api-key":apiKey,"anthropic-version":"2023-06-01"},
        body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:600,system,
          messages:[...messages,userMsg].map(m=>({role:m.role,content:m.content}))})
      });
      const data=await res.json();
      if(data.error)throw new Error(data.error.message);
      setMessages(m=>[...m,{role:"assistant",content:data.content?.[0]?.text||"Connection issue."}]);
    }catch(e){
      setMessages(m=>[...m,{role:"assistant",content:`Error: ${e.message||"Check your internet."}`}]);
    }
    setChatLoading(false);
  }

  // ── Derived values ─────────────────────────────────────────────────────────
  const elevFt = elevation != null ? elevation * 3.28084 : null;
  const safety = calcSafety(elevFt);
  const hasLifeThreat = alerts.some(a=>alertPriority(a.event)==="red");

  const sortedShelters = [...shelters]
    .map(s=>({...s,distMi:location?haversine(location.lat,location.lon,s.lat,s.lon):null}))
    .sort((a,b)=>(a.distMi??9999)-(b.distMi??9999))
    .filter(s=>!shelterSearch||s.name.toLowerCase().includes(shelterSearch.toLowerCase())||s.city.toLowerCase().includes(shelterSearch.toLowerCase()));

  const NAV=[
    {id:"home",  e:"🛟",label:"Home"},
    {id:"shelter",e:"🏫",label:"Shelter"},
    {id:"flights",e:"✈️",label:"Escape"},
    {id:"help",  e:"🆘",label:"Help"},
  ];

  // ── ONBOARDING ──────────────────────────────────────────────────────────────
  if(!onboarded) return(
    <div style={{fontFamily:"'Nunito',system-ui,sans-serif",background:C.bg,minHeight:"100dvh",
      display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Fraunces:wght@700;900&display=swap');
        .fd{font-family:'Fraunces',Georgia,serif}.fl{animation:fl 4s ease-in-out infinite}
        @keyframes fl{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
        input::placeholder{color:#3d6880}`}</style>
      <span className="fl" style={{fontSize:72,marginBottom:24}}>🛟</span>
      <h1 className="fd" style={{fontSize:32,fontWeight:900,color:C.cyan,textAlign:"center",marginBottom:10}}>
        Welcome to Lifeboat
      </h1>
      <p style={{fontSize:15,color:C.textSec,textAlign:"center",maxWidth:320,lineHeight:1.7,marginBottom:32}}>
        Enter your name and we'll personalize your real-time safety alerts.
      </p>
      <div style={{width:"100%",maxWidth:360,display:"flex",flexDirection:"column",gap:12}}>
        <input autoFocus value={nameInput} onChange={e=>setNameInput(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&submitName()}
          placeholder="Your first name…"
          style={{...inp,fontSize:16,padding:"14px 18px",textAlign:"center",borderColor:C.cyanDim}}/>
        <button onClick={submitName}
          style={{padding:"14px",borderRadius:16,fontWeight:900,fontSize:15,border:"none",cursor:"pointer",
            background:"linear-gradient(135deg,#0891b2,#0e7490)",color:"#fff",
            boxShadow:"0 4px 22px rgba(8,145,178,0.45)"}}>
          Begin Resilience Sync →
        </button>
      </div>
    </div>
  );

  // ── MAIN APP ──────────────────────────────────────────────────────────────
  return(
    <div style={{fontFamily:"'Nunito',system-ui,sans-serif",background:C.bg,minHeight:"100dvh",display:"flex",flexDirection:"column"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Fraunces:wght@700;900&display=swap');
        .fd{font-family:'Fraunces',Georgia,serif}
        .gc{background:${C.bg2};border:1px solid ${C.border}}
        .lft{transition:transform .18s,box-shadow .18s}.lft:hover{transform:translateY(-3px);box-shadow:0 10px 30px rgba(34,211,238,0.08)}
        .pill{border-radius:999px}
        .fl{animation:fl 5s ease-in-out infinite}@keyframes fl{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideDown{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}
        .bts{background:linear-gradient(135deg,#0f766e,#0d9488);color:#fff}.glow-s:hover{box-shadow:0 0 22px rgba(45,212,191,0.35)}
        .slide-down{animation:slideDown .22s ease}
        .chat-msg{animation:fadeIn .25s ease}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:${C.borderLt};border-radius:2px}
        input::placeholder,textarea::placeholder{color:${C.textMute}}
        input:-webkit-autofill{-webkit-box-shadow:0 0 0 100px ${C.bg3} inset;-webkit-text-fill-color:${C.textPri}}
      `}</style>

      {/* TOAST */}
      {toast&&(
        <div style={{position:"fixed",top:16,left:"50%",transform:"translateX(-50%)",zIndex:60,maxWidth:380,width:"92vw",
          background:"linear-gradient(135deg,#065f46,#064e3b)",border:"1px solid #059669",
          borderRadius:18,padding:"12px 16px",boxShadow:"0 8px 30px rgba(0,0,0,0.6)",
          display:"flex",alignItems:"flex-start",gap:10}}>
          <CheckCircle size={16} style={{color:C.sage,marginTop:2,flexShrink:0}}/>
          <span style={{fontWeight:700,fontSize:13,color:"#a7f3d0",flex:1}}>{toast}</span>
          <button onClick={()=>setToast(null)} style={{marginLeft:"auto",color:C.sage,background:"none",border:"none",cursor:"pointer"}}><X size={14}/></button>
        </div>
      )}

      {/* HEADER */}
      <header style={{position:"sticky",top:0,zIndex:30,background:"rgba(6,14,26,0.96)",backdropFilter:"blur(20px)",
        borderBottom:`1px solid ${C.border}`,boxShadow:"0 2px 20px rgba(0,0,0,0.5)"}}>
        <div style={{maxWidth:560,margin:"0 auto",padding:"10px 16px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span className="fl" style={{fontSize:26,lineHeight:1}}>🛟</span>
            <div>
              <div className="fd" style={{fontSize:19,fontWeight:900,color:C.cyan,lineHeight:1}}>Lifeboat</div>
              <div style={{fontSize:10,fontWeight:700,color:C.cyanDim}}>
                {conditions?.city?`${conditions?.city}, ${conditions?.state}`:location?"Loading…":"No location"}
              </div>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            {conditions?.temp!=null&&(
              <div style={{display:"flex",alignItems:"center",gap:5,fontSize:12,color:C.textSec,fontWeight:700}}>
                <Thermometer size={11} style={{color:C.amber}}/>{conditions?.temp}°F
                {conditions?.windSpeed!=null&&<><Wind size={11} style={{color:C.cyan,marginLeft:3}}/>{conditions?.windSpeed}mph</>}
              </div>
            )}
            {weatherLoading&&<Loader size={12} style={{color:C.textMute,animation:"spin 1s linear infinite"}}/>}
            {alerts.length>0&&(
              <div style={{position:"relative"}}>
                <Bell size={16} style={{color:hasLifeThreat?C.red:C.amber}}/>
                <span style={{position:"absolute",top:-4,right:-4,width:8,height:8,borderRadius:"50%",
                  background:hasLifeThreat?C.red:C.amber,animation:"pulse 1.5s infinite"}}/>
              </div>
            )}
            <button onClick={()=>setShowKeyPanel(true)} style={{background:"none",border:"none",cursor:"pointer"}}>
              <Key size={13} style={{color:keyValid?C.sage:C.textMute}}/>
            </button>
            <span style={{fontSize:11,fontWeight:600,color:C.textMute}}>{timeStr(time)}</span>
          </div>
        </div>
      </header>

      {/* ALERT BANNERS */}
      {alerts.filter(a=>alertPriority(a.event)==="red").map(a=>(
        <div key={a.id} style={{background:"linear-gradient(135deg,#7f1d1d,#991b1b)",borderBottom:"1px solid #dc2626",padding:"10px 16px",cursor:"pointer"}}
          onClick={()=>setAlertExpanded(alertExpanded===a.id?null:a.id)}>
          <div style={{maxWidth:560,margin:"0 auto",display:"flex",alignItems:"center",gap:10}}>
            <AlertTriangle size={15} style={{color:"#fca5a5",flexShrink:0}}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontWeight:900,fontSize:13,color:"#fff"}}>{a.event}</div>
              <div style={{fontSize:11,color:"#fca5a5",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.headline}</div>
            </div>
            <ChevronDown size={13} style={{color:"#fca5a5",flexShrink:0,transform:alertExpanded===a.id?"rotate(180deg)":"none",transition:"transform .2s"}}/>
          </div>
          {alertExpanded===a.id&&(
            <div style={{maxWidth:560,margin:"10px auto 0",fontSize:12,color:"#fecaca",lineHeight:1.6,borderTop:"1px solid rgba(255,255,255,0.1)",paddingTop:10}}>
              {a.description?.slice(0,500)}{a.description?.length>500?"…":""}
              {a.instruction&&<div style={{marginTop:8,fontWeight:700,color:"#fff"}}>📢 {a.instruction.slice(0,300)}</div>}
              {a.expires&&<div style={{marginTop:6,fontSize:10,color:"rgba(252,165,165,0.6)"}}>Expires: {new Date(a.expires).toLocaleString()}</div>}
            </div>
          )}
        </div>
      ))}
      {alerts.filter(a=>alertPriority(a.event)==="amber").slice(0,1).map(a=>(
        <div key={a.id} style={{background:"linear-gradient(135deg,#78350f,#92400e)",borderBottom:"1px solid #d97706",padding:"8px 16px"}}>
          <div style={{maxWidth:560,margin:"0 auto",display:"flex",alignItems:"center",gap:8}}>
            <AlertTriangle size={12} style={{color:C.amber,flexShrink:0}}/>
            <div style={{fontSize:12,fontWeight:700,color:"#fef3c7",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.event} — {a.headline?.slice(0,80)}</div>
          </div>
        </div>
      ))}

      {/* SAFETY BANNER — Historical Brain output */}
      {safety?.status==="critical"&&(
        <div style={{background:"linear-gradient(135deg,#7f1d1d,#991b1b)",borderBottom:"1px solid #dc2626",padding:"12px 16px"}}>
          <div style={{maxWidth:560,margin:"0 auto"}}>
            <div style={{fontWeight:900,fontSize:14,color:"#fff",marginBottom:4}}>
              ⚠️ CRITICAL SURGE RISK — {userName}, evacuate now.
            </div>
            <div style={{fontSize:12,color:"#fca5a5",lineHeight:1.5,marginBottom:8}}>
              Your elevation ({elevFt?.toFixed(0)}ft) is below the Helene threshold (6.04ft + 3ft buffer).
              We've found a safe path — let's head to your nearest high-ground shelter.
            </div>
            <button onClick={()=>setTab("shelter")}
              style={{width:"100%",background:"rgba(255,255,255,0.1)",color:"#fecaca",fontWeight:900,fontSize:13,
                padding:"9px",borderRadius:12,border:"1px solid rgba(255,255,255,0.2)",cursor:"pointer"}}>
              Route to Nearest Shelter →
            </button>
          </div>
        </div>
      )}
      {safety?.status==="caution"&&(
        <div style={{background:"linear-gradient(135deg,#78350f,#92400e)",borderBottom:"1px solid #d97706",padding:"10px 16px"}}>
          <div style={{maxWidth:560,margin:"0 auto",fontSize:12,color:"#fef3c7",fontWeight:700}}>
            ⚡ {userName}, your elevation ({elevFt?.toFixed(0)}ft) is marginal. Have your go-bag ready.
          </div>
        </div>
      )}

      {/* MAIN */}
      <main style={{flex:1,maxWidth:560,margin:"0 auto",width:"100%",padding:"20px 16px 100px",display:"flex",flexDirection:"column",gap:16}}>

        {/* ══ HOME ══ */}
        {tab==="home"&&<>
          {/* Hero card */}
          <div style={{borderRadius:28,overflow:"hidden",boxShadow:"0 12px 40px rgba(0,0,0,0.6)"}}>
            <div style={{background:"linear-gradient(148deg,#020c1b 0%,#0a1f3a 55%,#0c2a4a 100%)",padding:"24px 24px 0",position:"relative"}}>
              <div style={{position:"absolute",top:16,left:16,width:130,height:130,borderRadius:"50%",
                background:"radial-gradient(circle,rgba(34,211,238,0.1) 0%,transparent 70%)",pointerEvents:"none"}}/>
              <div className="fl" style={{fontSize:44,lineHeight:1,display:"inline-block",marginBottom:10}}>🛟</div>
              <h1 className="fd" style={{fontSize:26,fontWeight:900,lineHeight:1.25,marginBottom:6,color:C.textPri}}>
                {greeting()}, {userName}.
              </h1>
              <p style={{color:C.textSec,fontSize:13,lineHeight:1.6,marginBottom:4,maxWidth:300}}>
                {alerts.length>0?`${alerts.length} active alert${alerts.length>1?"s":""} for your area.`
                  :location?"No active alerts. Stay prepared."
                  :"Set your location to load live alerts."}
              </p>

              {/* Elevation + safety margin cards */}
              {elevFt!=null&&(
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:12,marginBottom:12}}>
                  <div style={{background:"rgba(0,0,0,0.3)",borderRadius:16,padding:"12px",border:`1px solid ${C.borderLt}`}}>
                    <div style={{fontSize:10,color:C.textMute,textTransform:"uppercase",marginBottom:4}}>Your Elevation</div>
                    <div style={{fontSize:22,fontWeight:900,color:safety?.status==="critical"?C.red:safety?.status==="caution"?C.amber:C.sage}}>
                      {elevFt.toFixed(1)}<span style={{fontSize:13,fontWeight:400,color:C.textMute}}> ft</span>
                    </div>
                  </div>
                  <div style={{background:"rgba(0,0,0,0.3)",borderRadius:16,padding:"12px",border:`1px solid ${C.borderLt}`}}>
                    <div style={{fontSize:10,color:C.textMute,textTransform:"uppercase",marginBottom:4}}>Safety Margin</div>
                    <div style={{fontSize:22,fontWeight:900,color:safety?.status==="critical"?C.red:safety?.status==="caution"?C.amber:C.sage}}>
                      {safety?.margin.toFixed(1)}<span style={{fontSize:13,fontWeight:400,color:C.textMute}}> ft</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Location controls */}
              {location?(
                <div style={{padding:"8px 0 4px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
                    <MapPin size={12} style={{color:location?.source==="gps"?C.cyan:C.amber,flexShrink:0}}/>
                    <span style={{fontSize:11,color:C.textSec,fontWeight:700}}>
                {location?.source==="gps"?`GPS · ${location?.lat?.toFixed(4)}°N`:location?.label}
                      {" · "}
                      <button onClick={()=>setShowManual(v=>!v)}
                        style={{background:"none",border:"none",cursor:"pointer",color:C.cyanDim,fontWeight:800,fontSize:11,padding:0}}>
                        change
                      </button>
                    </span>
                  </div>
                  <button onClick={()=>loadWeather(location.lat,location.lon)} disabled={weatherLoading}
                    style={{fontSize:11,color:C.cyanDim,background:"none",border:"none",cursor:"pointer",padding:0,fontWeight:700,display:"flex",alignItems:"center",gap:4}}>
                    <RefreshCw size={11} style={{animation:weatherLoading?"spin 1s linear infinite":"none"}}/>
                    {lastRefresh?`Updated ${timeStr(lastRefresh)}`:"Refresh"}
                  </button>
                </div>
              ):(
                <div style={{marginTop:10,marginBottom:8,display:"flex",flexDirection:"column",gap:8}}>
                  <button onClick={requestGPS} disabled={locLoading}
                    style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:10,
                      padding:"13px",borderRadius:16,fontWeight:900,fontSize:14,border:"none",cursor:locLoading?"not-allowed":"pointer",
                      background:locLoading?"rgba(255,255,255,0.05)":"linear-gradient(135deg,#0891b2,#0e7490)",
                      color:locLoading?C.textMute:"#fff",boxShadow:locLoading?"none":"0 4px 22px rgba(8,145,178,0.45)"}}>
                    {locLoading?<><Loader size={16} style={{animation:"spin 1s linear infinite"}}/>Getting location…</>
                      :<><Navigation size={16}/>Use My GPS Location</>}
                  </button>
                  <button onClick={()=>setShowManual(true)}
                    style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:8,
                      padding:"11px",borderRadius:14,fontWeight:700,fontSize:13,border:`1px solid ${C.borderLt}`,
                      background:"transparent",color:C.textSec,cursor:"pointer"}}>
                    <MapPin size={14}/>Enter ZIP or city instead
                  </button>
                </div>
              )}

              {/* GPS error */}
              {locError&&!showManual&&(
                <div style={{marginBottom:8,display:"flex",alignItems:"center",gap:8}}>
                  <MapPinOff size={13} style={{color:C.amber,flexShrink:0}}/>
                  <span style={{fontSize:12,color:C.amber,fontWeight:600}}>{locError}</span>
                </div>
              )}

              {/* MANUAL ENTRY PANEL */}
              {showManual&&(
                <div className="slide-down" style={{marginBottom:10}}>
                  <div style={{background:"rgba(8,145,178,0.08)",border:`1px solid ${C.cyanDim}50`,borderRadius:16,padding:14}}>
                    <div style={{fontSize:12,fontWeight:800,color:C.cyan,marginBottom:10,display:"flex",alignItems:"center",gap:6}}>
                      <MapPin size={13}/>Enter your location
                    </div>
                    <div style={{display:"flex",gap:8,marginBottom:10}}>
                      <input autoFocus value={manualInput}
                        onChange={e=>{setManualInput(e.target.value);setManualError("");}}
                        onKeyDown={e=>e.key==="Enter"&&submitManual()}
                        placeholder="ZIP code or City, State"
                        style={{...inp,flex:1,fontSize:13,padding:"10px 12px"}}/>
                      <button onClick={submitManual} disabled={manualLoading||!manualInput.trim()}
                        style={{padding:"10px 14px",borderRadius:12,fontWeight:900,fontSize:13,border:"none",flexShrink:0,
                          cursor:manualLoading||!manualInput.trim()?"not-allowed":"pointer",
                          background:manualLoading||!manualInput.trim()?"rgba(255,255,255,0.05)":"linear-gradient(135deg,#0891b2,#0e7490)",
                          color:manualLoading||!manualInput.trim()?C.textMute:"#fff",
                          display:"flex",alignItems:"center",gap:6}}>
                        {manualLoading?<Loader size={14} style={{animation:"spin 1s linear infinite"}}/>:<Search size={14}/>}
                      </button>
                    </div>
                    {manualError&&(
                      <div style={{fontSize:12,color:C.red,marginBottom:8,fontWeight:600,display:"flex",gap:6,alignItems:"center"}}>
                        <AlertTriangle size={12} style={{flexShrink:0}}/>{manualError}
                      </div>
                    )}
                    {/* Quick FL picks */}
                    <div style={{fontSize:11,color:C.textMute,marginBottom:6,fontWeight:600}}>Quick select:</div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                      {FL_QUICK.map(({zip,label})=>(
                        <button key={zip} onClick={()=>{setManualInput(zip);setManualError("");}}
                          style={{fontSize:11,fontWeight:700,padding:"5px 11px",borderRadius:999,
                            background:manualInput===zip?C.cyanFaint:C.bg3,
                            border:`1px solid ${manualInput===zip?C.cyanDim:C.borderLt}`,
                            color:manualInput===zip?C.cyan:C.textSec,cursor:"pointer"}}>
                          {label}
                        </button>
                      ))}
                    </div>
                    {location&&(
                      <button onClick={()=>{setShowManual(false);setManualError("");}}
                        style={{marginTop:10,fontSize:12,color:C.textMute,background:"none",border:"none",cursor:"pointer",fontWeight:600}}>
                        ✕ Cancel
                      </button>
                    )}
                  </div>
                </div>
              )}
              <p style={{color:"rgba(253,230,138,0.3)",fontSize:10,textAlign:"center",paddingBottom:18,marginTop:4}}>
                Live: NOAA NWS · Open Elevation · Historical Brain Active
              </p>
            </div>
            <div style={{height:24,background:C.bg,overflow:"hidden",marginTop:-1}}>
              <svg viewBox="0 0 800 24" preserveAspectRatio="none" style={{width:"100%",height:"100%"}}>
                <path d="M0,12 C133,24 267,0 400,12 C533,24 667,0 800,12 L800,24 L0,24 Z" fill="#0c2a4a"/>
              </svg>
            </div>
          </div>

          {/* Live conditions */}
          {conditions&&(
            <div className="gc" style={{borderRadius:22,padding:16,border:`1px solid ${C.borderLt}`}}>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:12}}>
                <CloudRain size={13} style={{color:C.cyan}}/>
                <span style={{fontWeight:900,color:C.textSec,fontSize:12}}>Live Conditions — {conditions?.city}, {conditions?.state}</span>
                <span style={{marginLeft:"auto",fontSize:9,color:C.textMute}}>NWS · {conditions?.station}</span>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8}}>
                {[
                  {e:"🌡️",v:conditions?.temp!=null?`${conditions?.temp}°F`:"—",l:"Temp"},
                  {e:"💨",v:conditions?.windSpeed!=null?`${conditions?.windSpeed}mph`:"—",l:"Wind"},
                  {e:"💧",v:conditions?.humidity!=null?`${conditions?.humidity}%`:"—",l:"Humidity"},
                  {e:"📡",v:conditions?.barometric!=null?`${conditions?.barometric}mb`:"—",l:"Pressure"},
                ].map((s,i)=>(
                  <div key={i} style={{background:C.bg3,borderRadius:12,padding:"10px 6px",textAlign:"center"}}>
                    <div style={{fontSize:18,marginBottom:2}}>{s.e}</div>
                    <div style={{fontWeight:900,fontSize:12,color:C.textPri}}>{s.v}</div>
                    <div style={{fontSize:10,color:C.textMute}}>{s.l}</div>
                  </div>
                ))}
              </div>
              {conditions?.description&&<div style={{marginTop:10,background:C.bg3,borderRadius:10,padding:"8px 12px",fontSize:12,color:C.textSec,fontWeight:600}}>🌤️ {conditions?.description}</div>}
            </div>
          )}

          {/* Alerts list */}
          {alerts.length>0&&(
            <div>
              <div style={{fontWeight:900,color:C.textSec,fontSize:12,marginBottom:10,display:"flex",alignItems:"center",gap:6}}>
                <Bell size={12} style={{color:C.red}}/>{alerts.length} ACTIVE NWS ALERT{alerts.length>1?"S":""} FOR YOUR AREA
              </div>
              {alerts.map(a=>{
                const pri=alertPriority(a.event);
                const col={red:{bg:"rgba(30,7,7,0.7)",brd:"#3d1515",tc:C.red},amber:{bg:"rgba(28,20,5,0.7)",brd:"#3d2e08",tc:C.amber},blue:{bg:"rgba(5,20,35,0.7)",brd:"#0f2d5c",tc:C.cyan}}[pri];
                return(
                  <div key={a.id} style={{borderRadius:16,border:`1px solid ${col.brd}`,background:col.bg,padding:"12px 14px",marginBottom:8,cursor:"pointer"}}
                    onClick={()=>setAlertExpanded(alertExpanded===a.id?null:a.id)}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <span style={{width:7,height:7,borderRadius:"50%",background:col.tc,flexShrink:0,animation:pri==="red"?"pulse 1.5s infinite":""}}/>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontWeight:900,color:C.textPri,fontSize:13}}>{a.event}</div>
                        <div style={{fontSize:11,color:C.textSec,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.headline?.slice(0,90)}</div>
                      </div>
                      <ChevronDown size={12} style={{color:C.textMute,flexShrink:0,transform:alertExpanded===a.id?"rotate(180deg)":"none",transition:"transform .2s"}}/>
                    </div>
                    {alertExpanded===a.id&&(
                      <div style={{marginTop:10,borderTop:`1px solid ${col.brd}`,paddingTop:10,fontSize:12,color:C.textSec,lineHeight:1.6}}>
                        {a.description?.slice(0,500)}{a.description?.length>500?"…":""}
                        {a.instruction&&<div style={{marginTop:8,fontWeight:800,color:col.tc}}>📢 {a.instruction.slice(0,300)}</div>}
                        {a.expires&&<div style={{marginTop:6,fontSize:10,color:C.textMute}}>Expires: {new Date(a.expires).toLocaleString()}</div>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {location&&alerts.length===0&&!weatherLoading&&(
            <div style={{borderRadius:16,border:"1px solid #065f46",background:"rgba(4,40,30,0.5)",padding:"12px 14px",display:"flex",gap:10,alignItems:"center"}}>
              <CheckCircle size={15} style={{color:C.sage,flexShrink:0}}/>
              <div>
                <div style={{fontWeight:900,color:C.sage,fontSize:13}}>No active alerts for your area</div>
                <div style={{fontSize:11,color:C.textSec,marginTop:2}}>Live NWS data shows no current warnings at your coordinates.</div>
              </div>
            </div>
          )}

          {/* Quick actions */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {[
              {id:"shelter",e:"🏫",t:"Find Shelter",s:"Nearest high-ground shelter",brd:"#083344"},
              {id:"flights",e:"✈️",t:"Fly Out",s:"Evacuation flights",brd:"#0f2d5c"},
              {id:"help",e:"🆘",t:"Request Help",s:"Bypass jammed 911 lines",brd:"#3d1515"},
            ].map(a=>(
              <button key={a.id} onClick={()=>setTab(a.id)} className="lft"
                style={{borderRadius:20,padding:14,textAlign:"left",cursor:"pointer",display:"flex",flexDirection:"column",gap:5,background:C.bg2,border:`1px solid ${a.brd}`}}>
                <div style={{fontSize:22}}>{a.e}</div>
                <div style={{fontWeight:900,color:C.textPri,fontSize:13,lineHeight:1.2}}>{a.t}</div>
                <div style={{fontSize:11,color:C.textMute,lineHeight:1.4}}>{a.s}</div>
                <div style={{display:"flex",alignItems:"center",gap:4,fontSize:11,fontWeight:700,color:C.cyan,marginTop:2}}>Go <ChevronRight size={11}/></div>
              </button>
            ))}
            <button onClick={()=>keyValid?setChatOpen(true):setShowKeyPanel(true)} className="lft"
              style={{borderRadius:20,padding:14,textAlign:"left",cursor:"pointer",display:"flex",flexDirection:"column",gap:5,background:C.bg2,border:`1px solid ${keyValid?"#2e1065":"#1a3558"}`}}>
              <div style={{fontSize:22}}>💬</div>
              <div style={{fontWeight:900,color:C.textPri,fontSize:13}}>Ask Beacon</div>
              <div style={{fontSize:11,color:C.textMute,lineHeight:1.4}}>{keyValid?"AI with live data":"Activate Beacon AI"}</div>
              <div style={{display:"flex",alignItems:"center",gap:4,fontSize:11,fontWeight:700,color:keyValid?"#c084fc":C.textMute,marginTop:2}}>
                {keyValid?"Chat":"Setup"}<ChevronRight size={11}/>
              </div>
            </button>
          </div>

          {/* SOS preview */}
          <div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
              <span style={{fontWeight:900,color:C.textSec,fontSize:13,display:"flex",alignItems:"center",gap:6}}>
                <Heart size={13} style={{color:C.red}}/>Nearby Help Requests
              </span>
              <button onClick={()=>setTab("help")} style={{fontSize:12,fontWeight:700,color:C.cyan,background:"none",border:"none",cursor:"pointer"}}>All →</button>
            </div>
            {sosList.filter(s=>s.priority==="red").slice(0,2).map(r=>(
              <div key={r.id} className="gc" style={{borderRadius:16,padding:"11px 14px",display:"flex",alignItems:"flex-start",gap:10,border:"1px solid #3d1515",marginBottom:8}}>
                <span style={{width:8,height:8,borderRadius:"50%",background:C.red,flexShrink:0,marginTop:4,animation:"pulse 1.5s infinite"}}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:800,color:C.textPri,fontSize:13}}>{r.name}<span style={{fontWeight:400,color:C.textMute,marginLeft:6,fontSize:12}}>· {r.location}</span></div>
                  <div style={{fontSize:12,color:C.textSec,marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.need}</div>
                </div>
                <span style={{fontSize:11,color:C.textMute,flexShrink:0}}>{r.time}</span>
              </div>
            ))}
          </div>
        </>}

        {/* ══ SHELTER ══ */}
        {tab==="shelter"&&<>
          <div>
            <h1 className="fd" style={{fontSize:24,fontWeight:900,color:C.textPri,marginBottom:4}}>Find a Safe Shelter</h1>
            <p style={{fontSize:13,color:C.textSec,lineHeight:1.5}}>{location?"Sorted by distance from your location. High-elevation prioritized.":"Set your location on Home for distance sorting."}</p>
          </div>
          <div className="gc" style={{borderRadius:18,padding:12,border:`1px solid ${C.borderLt}`}}>
            <div style={{position:"relative"}}>
              <Search size={13} style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:C.textMute}}/>
              <input value={shelterSearch} onChange={e=>setShelterSearch(e.target.value)} placeholder="Search city or shelter…" style={{...inp,paddingLeft:34}}/>
            </div>
          </div>
          {confirmed.length>0&&(
            <div style={{borderRadius:18,background:"rgba(4,40,30,0.6)",border:"1px solid #065f46",padding:14}}>
              <div style={{fontWeight:900,color:C.sage,fontSize:13,marginBottom:10,display:"flex",gap:6,alignItems:"center"}}><CheckCircle size={13}/>Your Reservations</div>
              {confirmed.map((c,i)=>(
                <div key={i} style={{background:C.bg3,borderRadius:12,padding:"10px 14px",display:"flex",gap:10,alignItems:"center",border:"1px solid #065f46",marginBottom:6}}>
                  <span style={{fontSize:18}}>🏫</span>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:800,color:C.textPri,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.shelterName}</div>
                    <div style={{fontSize:11,color:C.textSec}}>{c.name} · {c.people} guest{c.people>1?"s":""}{c.pets?" · 🐾":""}{c.medical?" · 🏥":""}</div>
                  </div>
                  <div style={{textAlign:"right",flexShrink:0}}>
                    <div style={{fontWeight:900,color:C.teal,fontSize:11}}>{c.confirmCode}</div>
                    <div style={{color:C.textMute,fontSize:10}}>Confirmed ✓</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {sortedShelters.map(s=>{
            const pct=Math.round(((s.capacity-s.reserved)/s.capacity)*100);
            const bc=pct>60?C.sage:pct>25?C.amber:C.red;
            const isConf=confirmed.some(c=>c.shelterId===s.id);
            return(
              <div key={s.id} className="gc lft" style={{borderRadius:22,border:`1px solid ${C.borderLt}`}}>
                <div style={{padding:16}}>
                  <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:8,marginBottom:8}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",flexWrap:"wrap",gap:6,alignItems:"center",marginBottom:4}}>
                        <span style={{fontWeight:900,color:C.textPri,fontSize:14}}>{s.name}</span>
                        {isConf&&<span className="pill" style={{fontSize:11,fontWeight:900,background:C.sage,color:"#021b0e",padding:"2px 8px"}}>Reserved 🎉</span>}
                      </div>
                      <div style={{fontSize:11,color:C.textMute,display:"flex",gap:8,flexWrap:"wrap"}}>
                        <span>📍 {s.city}, FL</span><span>⛰️ {s.elevation}ft</span>
                        {s.distMi!=null&&<span>🗺️ {s.distMi<10?s.distMi.toFixed(1):Math.round(s.distMi)}mi away</span>}
                      </div>
                    </div>
                    <div style={{textAlign:"right",flexShrink:0}}>
                      <div style={{fontWeight:900,fontSize:20,color:bc,lineHeight:1}}>{pct}%</div>
                      <div style={{fontSize:10,color:C.textMute}}>available</div>
                    </div>
                  </div>
                  <div style={{height:5,background:C.bg3,borderRadius:4,marginBottom:10,overflow:"hidden"}}>
                    <div style={{height:"100%",borderRadius:4,background:bc,width:`${100-pct}%`,opacity:.85}}/>
                  </div>
                  <div style={{fontSize:12,color:C.textSec,marginBottom:10}}>
                    <span style={{fontWeight:800,color:C.textPri}}>{(s.capacity-s.reserved).toLocaleString()}</span>
                    <span style={{color:C.textMute}}> of {s.capacity.toLocaleString()} spots open</span>
                  </div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12}}>
                    {s.amenities.map(a=>(
                      <span key={a} className="pill" style={{fontSize:11,background:C.bg3,color:C.textSec,border:`1px solid ${C.borderLt}`,padding:"3px 10px",fontWeight:600}}>
                        {AMENITY_ICONS[a]} {a}
                      </span>
                    ))}
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                    <button onClick={()=>pct>0&&!isConf&&setReserving(s.id)} disabled={pct===0||isConf}
                      className={pct>0&&!isConf?"bts glow-s":""}
                      style={{padding:"11px",borderRadius:14,fontWeight:900,fontSize:12,border:"none",cursor:pct===0||isConf?"default":"pointer",
                        background:isConf?"rgba(4,40,30,0.6)":pct===0?C.bg3:undefined,
                        color:isConf?C.sage:pct===0?C.textMute:undefined,
                        outline:isConf?"1px solid #065f46":pct===0?`1px solid ${C.border}`:"none"}}>
                      {isConf?"✓ Reserved":pct===0?"Full":"Reserve →"}
                    </button>
                    <a href={hotelURL(s.city)} target="_blank" rel="noopener noreferrer"
                      style={{padding:"11px",borderRadius:14,fontWeight:900,fontSize:12,border:`1px solid ${C.borderLt}`,
                        background:C.bg3,color:C.cyan,textDecoration:"none",display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
                      <Hotel size={12}/>Nearby Hotels
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </>}

        {/* ══ FLIGHTS ══ */}
        {tab==="flights"&&<>
          <div>
            <h1 className="fd" style={{fontSize:24,fontWeight:900,color:C.textPri,marginBottom:4}}>Evacuation Flights</h1>
            <p style={{fontSize:13,color:C.textSec,lineHeight:1.5}}>Live search via Google Flights from {conditions?.city||"your area"}. Tap a destination.</p>
          </div>
          <div className="gc" style={{borderRadius:18,padding:14,border:`1px solid ${C.borderLt}`}}>
            <div style={{fontSize:11,fontWeight:900,color:C.textMute,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Nearest Airports</div>
            {[{code:"TPA",name:"Tampa International",dist:"~20mi"},{code:"PIE",name:"St. Pete-Clearwater",dist:"~30mi"},{code:"MCO",name:"Orlando International",dist:"~80mi"}].map(a=>(
              <div key={a.code} style={{display:"flex",alignItems:"center",gap:12,padding:"9px 12px",borderRadius:11,background:C.bg3,border:`1px solid ${C.border}`,marginBottom:6}}>
                <Plane size={13} style={{color:C.cyan,flexShrink:0}}/>
                <span style={{fontWeight:800,color:C.textPri,fontSize:13}}>{a.code}</span>
                <span style={{color:C.textSec,fontSize:12}}>{a.name}</span>
                <span style={{marginLeft:"auto",fontSize:11,color:C.textMute}}>{a.dist}</span>
              </div>
            ))}
          </div>
          <div style={{fontSize:11,fontWeight:900,color:C.textMute,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Choose a Destination</div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {[
              {city:"Atlanta, GA",code:"ATL",why:"Major hub · Far inland",emoji:"🌳"},
              {city:"Charlotte, NC",code:"CLT",why:"Mountain elevation · Storm-safe",emoji:"⛰️"},
              {city:"Nashville, TN",code:"BNA",why:"Well inland · Shelters open",emoji:"🎸"},
              {city:"Dallas / Ft Worth",code:"DFW",why:"Far from storm track",emoji:"🤠"},
              {city:"Houston, TX",code:"HOU",why:"Southwest hub · Fast boarding",emoji:"🚀"},
              {city:"Washington D.C.",code:"DCA",why:"Mid-Atlantic · Far from FL",emoji:"🏛️"},
              {city:"New York City",code:"JFK",why:"Northeast hub · Family connections",emoji:"🗽"},
            ].map(d=>(
              <a key={d.code} href={flightURL(d.city)} target="_blank" rel="noopener noreferrer"
                className="gc lft" style={{borderRadius:20,padding:14,display:"flex",alignItems:"center",gap:14,border:`1px solid ${C.borderLt}`,textDecoration:"none"}}>
                <div style={{fontSize:28,flexShrink:0}}>{d.emoji}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:900,color:C.textPri,fontSize:14}}>{d.city}</div>
                  <div style={{fontSize:11,color:C.textMute,marginTop:2}}>{d.why}</div>
                  <div style={{display:"flex",alignItems:"center",gap:4,fontSize:11,fontWeight:700,color:C.cyan,marginTop:4}}>
                    <Plane size={10}/>{conditions?.city||"Tampa"} → {d.code} · Tomorrow
                  </div>
                </div>
                <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,flexShrink:0}}>
                  <div style={{width:36,height:36,borderRadius:11,background:"linear-gradient(135deg,#0891b2,#0e7490)",
                    display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 16px rgba(8,145,178,0.4)"}}>
                    <ExternalLink size={13} style={{color:"#fff"}}/>
                  </div>
                  <span style={{fontSize:9,fontWeight:700,color:C.cyanDim,textAlign:"center",lineHeight:1.2}}>Google<br/>Flights</span>
                </div>
              </a>
            ))}
          </div>
        </>}

        {/* ══ HELP ══ */}
        {tab==="help"&&<>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
            <div>
              <h1 className="fd" style={{fontSize:24,fontWeight:900,color:C.textPri,marginBottom:4}}>Triage Feed</h1>
              <p style={{fontSize:13,color:C.textSec}}>Reach responders without jamming 911 lines.</p>
            </div>
            <button onClick={()=>setSosOpen(true)}
              style={{display:"flex",alignItems:"center",gap:8,padding:"10px 18px",borderRadius:18,fontWeight:900,fontSize:13,
                background:"linear-gradient(135deg,#dc2626,#b91c1c)",color:"#fff",border:"none",cursor:"pointer",boxShadow:"0 4px 16px rgba(220,38,38,0.4)"}}>
              <Phone size={13}/>Request Help
            </button>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {sosList.map(r=>{
              const s={
                red:   {bg:"rgba(30,7,7,0.8)",  brd:"#3d1515",dot:C.red,  badge:"#dc2626",btxt:"#fff",  label:"CRITICAL"},
                yellow:{bg:"rgba(28,20,5,0.8)",  brd:"#3d2e08",dot:C.amber,badge:"#d97706",btxt:"#fff",  label:"ELEVATED"},
                green: {bg:"rgba(4,18,12,0.8)",  brd:"#0a2e1a",dot:C.sage, badge:C.cyanFaint,btxt:C.sage,label:"STABLE"},
              }[r.priority];
              return(
                <div key={r.id} style={{borderRadius:18,border:`1px solid ${s.brd}`,background:s.bg,padding:"13px 15px"}}>
                  <div style={{display:"flex",alignItems:"flex-start",gap:10}}>
                    <span style={{width:8,height:8,borderRadius:"50%",background:s.dot,flexShrink:0,marginTop:4,animation:r.priority==="red"?"pulse 1.5s infinite":""}}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",flexWrap:"wrap",gap:6,alignItems:"center",marginBottom:4}}>
                        <span style={{fontWeight:900,color:C.textPri}}>{r.name}</span>
                        <span className="pill" style={{fontSize:11,fontWeight:700,background:s.badge,color:s.btxt,padding:"2px 8px"}}>{s.label}</span>
                        <span className="pill" style={{fontSize:11,background:C.bg3,color:C.textMute,border:`1px solid ${C.border}`,padding:"2px 8px",textTransform:"capitalize"}}>{r.category}</span>
                      </div>
                      <p style={{fontSize:13,color:C.textSec,marginBottom:6}}>{r.need}</p>
                      <div style={{display:"flex",flexWrap:"wrap",gap:10,fontSize:11,color:C.textMute}}>
                        <span style={{display:"flex",alignItems:"center",gap:3}}><MapPin size={10}/>{r.location}</span>
                        <span style={{fontWeight:700,color:r.elevation<6?C.red:C.teal}}>⛰️ {r.elevation}ft</span>
                        <span><Clock size={10} style={{display:"inline",marginRight:2}}/>{r.time}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>}
      </main>

      {/* BOTTOM NAV */}
      <nav style={{position:"fixed",bottom:0,left:0,right:0,zIndex:30,
        background:"rgba(6,14,26,0.96)",backdropFilter:"blur(20px)",
        borderTop:`1px solid ${C.border}`,boxShadow:"0 -4px 24px rgba(0,0,0,0.5)"}}>
        <div style={{maxWidth:560,margin:"0 auto",display:"flex"}}>
          {NAV.map(item=>(
            <button key={item.id} onClick={()=>setTab(item.id)}
              style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2,
                padding:"10px 4px 8px",background:"none",border:"none",cursor:"pointer",position:"relative",
                color:tab===item.id?C.cyan:C.textMute,transition:"color .15s"}}>
              <span style={{fontSize:18,lineHeight:1}}>{item.e}</span>
              <span style={{fontSize:10,fontWeight:700}}>{item.label}</span>
              {tab===item.id&&<span style={{position:"absolute",bottom:0,left:"50%",transform:"translateX(-50%)",
                width:18,height:2,borderRadius:2,background:C.cyan,boxShadow:`0 0 8px ${C.cyan}`}}/>}
            </button>
          ))}
          <button onClick={()=>keyValid?setChatOpen(true):setShowKeyPanel(true)}
            style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2,
              padding:"10px 4px 8px",background:"none",border:"none",cursor:"pointer",position:"relative",
              color:keyValid?"#c084fc":C.textMute}}>
            <span style={{fontSize:18,lineHeight:1}}>💬</span>
            <span style={{fontSize:10,fontWeight:700}}>Beacon</span>
            {keyValid&&messages.length>0&&<span style={{position:"absolute",top:6,right:"16%",width:7,height:7,borderRadius:"50%",background:C.sage,border:`2px solid ${C.bg}`}}/>}
          </button>
        </div>
      </nav>

      {/* BEACON KEY PANEL */}
      {showKeyPanel&&(
        <div style={{position:"fixed",inset:0,zIndex:50,background:"rgba(0,0,0,0.8)",backdropFilter:"blur(8px)",
          display:"flex",alignItems:"flex-end",justifyContent:"center",padding:16}} onClick={()=>setShowKeyPanel(false)}>
          <div style={{width:"100%",maxWidth:500,background:C.bg2,borderRadius:28,overflow:"hidden",
            border:`1px solid ${C.borderLt}`,boxShadow:"0 24px 60px rgba(0,0,0,0.9)"}} onClick={e=>e.stopPropagation()}>
            <div style={{background:"linear-gradient(135deg,#2e1065,#4c1d95)",padding:"16px 20px",
              display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid #3b0764"}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:34,height:34,borderRadius:10,background:"rgba(255,255,255,0.1)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <span style={{fontSize:18}}>🔆</span>
                </div>
                <div>
                  <div style={{fontWeight:900,color:"#fff",fontSize:15}}>Activate Beacon AI</div>
                  <div style={{color:"#c4b5fd",fontSize:11,marginTop:1}}>Key stays on this device only</div>
                </div>
              </div>
              <button onClick={()=>setShowKeyPanel(false)} style={{background:"none",border:"none",cursor:"pointer"}}><X size={18} style={{color:"#a78bfa"}}/></button>
            </div>
            <div style={{padding:20,display:"flex",flexDirection:"column",gap:16}}>
              <div style={{background:"rgba(4,40,30,0.6)",border:"1px solid #065f46",borderRadius:14,padding:"10px 14px",display:"flex",gap:8,alignItems:"flex-start"}}>
                <ShieldCheck size={14} style={{color:C.sage,flexShrink:0,marginTop:1}}/>
                <div style={{fontSize:12,color:"#a7f3d0",lineHeight:1.5,fontWeight:600}}>
                  Stored in this browser via localStorage only. Only sent directly to Anthropic's API.
                </div>
              </div>
              {keyValid?(
                <div style={{display:"flex",flexDirection:"column",gap:12}}>
                  <div style={{background:"rgba(4,40,30,0.6)",border:"1px solid #065f46",borderRadius:14,padding:"12px 14px",display:"flex",gap:10,alignItems:"center"}}>
                    <CheckCircle size={16} style={{color:C.sage,flexShrink:0}}/>
                    <div>
                      <div style={{fontWeight:900,color:C.sage,fontSize:13}}>Beacon is active</div>
                      <div style={{fontSize:11,color:C.textSec,marginTop:1}}>Key …{apiKey.slice(-6)} · Stored locally</div>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:10}}>
                    <button onClick={()=>{setShowKeyPanel(false);setChatOpen(true);}}
                      style={{flex:1,background:"linear-gradient(135deg,#4f46e5,#7c3aed)",color:"#fff",border:"none",borderRadius:16,padding:"12px",fontWeight:900,fontSize:13,cursor:"pointer",boxShadow:"0 4px 16px rgba(124,58,237,0.4)"}}>
                      Open Beacon →
                    </button>
                    <button onClick={removeKey}
                      style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,padding:"12px 16px",borderRadius:16,border:`1px solid ${C.borderLt}`,background:C.bg3,color:C.red,fontWeight:700,fontSize:12,cursor:"pointer"}}>
                      <Trash2 size={13}/>Remove
                    </button>
                  </div>
                </div>
              ):(
                <>
                  <div>
                    <label style={{fontSize:11,fontWeight:900,color:C.textMute,textTransform:"uppercase",letterSpacing:1,display:"block",marginBottom:6}}>Your Anthropic API Key</label>
                    <div style={{position:"relative"}}>
                      <input value={keyInput} onChange={e=>setKeyInput(e.target.value)}
                        type={showKey?"text":"password"} placeholder="sk-ant-api03-…"
                        style={{...inp,paddingRight:44,fontFamily:"monospace",fontSize:12}}
                        onKeyDown={e=>e.key==="Enter"&&testAndSaveKey()}/>
                      <button onClick={()=>setShowKey(v=>!v)}
                        style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:C.textMute}}>
                        {showKey?<EyeOff size={15}/>:<Eye size={15}/>}
                      </button>
                    </div>
                    {keyError&&<div style={{fontSize:12,color:C.red,marginTop:6,fontWeight:600}}>{keyError}</div>}
                  </div>
                  <div style={{fontSize:12,color:C.textSec,lineHeight:1.6}}>
                    Get a free key at{" "}
                    <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" style={{color:C.cyan,fontWeight:700}}>console.anthropic.com →</a>
                  </div>
                  <div style={{display:"flex",gap:10}}>
                    <button onClick={()=>setShowKeyPanel(false)} style={{flex:1,border:`1px solid ${C.borderLt}`,color:C.textMute,borderRadius:16,padding:"12px",fontWeight:700,fontSize:13,background:"transparent",cursor:"pointer"}}>Cancel</button>
                    <button onClick={testAndSaveKey} disabled={keyTesting||!keyInput.trim()}
                      style={{flex:1,borderRadius:16,padding:"12px",fontWeight:900,fontSize:13,border:"none",cursor:keyTesting||!keyInput.trim()?"not-allowed":"pointer",
                        background:keyTesting||!keyInput.trim()?C.bg3:"linear-gradient(135deg,#4f46e5,#7c3aed)",
                        color:keyTesting||!keyInput.trim()?C.textMute:"#fff",
                        boxShadow:keyTesting||!keyInput.trim()?"none":"0 4px 16px rgba(124,58,237,0.4)",
                        display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                      {keyTesting?<><Loader size={14} style={{animation:"spin 1s linear infinite"}}/>Testing…</> :<><Key size={14}/>Activate Beacon</>}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CHATBOT */}
      {chatOpen&&(
        <div style={{position:"fixed",inset:0,zIndex:50,display:"flex",flexDirection:"column"}}>
          <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.6)",backdropFilter:"blur(6px)"}} onClick={()=>setChatOpen(false)}/>
          <div style={{position:"absolute",bottom:0,left:0,right:0,maxWidth:560,margin:"0 auto",
            background:C.bg2,border:`1px solid ${C.borderLt}`,borderRadius:"24px 24px 0 0",
            display:"flex",flexDirection:"column",height:"75vh",boxShadow:"0 -10px 40px rgba(0,0,0,0.7)"}}>
            <div style={{padding:"14px 18px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:12,flexShrink:0}}>
              <div style={{width:34,height:34,borderRadius:10,background:"linear-gradient(135deg,#4f46e5,#7c3aed)",
                display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 0 14px rgba(124,58,237,0.4)"}}>
                <span style={{fontSize:17}}>🔆</span>
              </div>
              <div>
                <div style={{fontWeight:900,color:C.textPri,fontSize:14}}>Beacon</div>
                <div style={{fontSize:10,color:C.textMute}}>
                  {location?`${location?.source==="gps"?"GPS":"Manual"}: ${conditions?.city||location?.label} · ${alerts.length} alert${alerts.length!==1?"s":""}`:
                  "No location"}{elevFt!=null?` · ${elevFt.toFixed(0)}ft elev`:""}
                </div>
              </div>
              <button onClick={()=>setChatOpen(false)} style={{marginLeft:"auto",background:"none",border:"none",cursor:"pointer",color:C.textMute}}><X size={17}/></button>
            </div>
            <div style={{flex:1,overflowY:"auto",padding:"14px",display:"flex",flexDirection:"column",gap:12}}>
              {messages.length===0&&(
                <div style={{textAlign:"center",padding:"24px 16px"}}>
                  <div style={{fontSize:36,marginBottom:10}}>🔆</div>
                  <div style={{fontWeight:900,color:C.textPri,fontSize:15,marginBottom:6}}>Hi {userName}, I'm Beacon.</div>
                  <div style={{fontSize:13,color:C.textSec,lineHeight:1.6,marginBottom:16}}>
                    {location?`Live data loaded for ${conditions?.city||location.label} — ${alerts.length} alert${alerts.length!==1?"s":""} active.`
                      :"Set your location on Home for location-aware answers."}
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    {["Am I in danger right now?",
                      alerts[0]?`What should I do about the ${alerts[0].event}?`:"What should I do to prepare?",
                      "Walk me through evacuation step by step.",
                      "Where's the safest shelter near me?",
                    ].map(q=>(
                      <button key={q} onClick={()=>setChatInput(q)}
                        style={{background:C.bg3,border:`1px solid ${C.borderLt}`,borderRadius:12,padding:"10px 14px",
                          fontSize:12,color:C.textSec,cursor:"pointer",textAlign:"left",fontWeight:600}}>
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((m,i)=>(
                <div key={i} className="chat-msg" style={{display:"flex",gap:8,flexDirection:m.role==="user"?"row-reverse":"row"}}>
                  <div style={{width:26,height:26,borderRadius:"50%",flexShrink:0,fontSize:13,
                    background:m.role==="user"?C.cyanFaint:"linear-gradient(135deg,#4f46e5,#7c3aed)",
                    display:"flex",alignItems:"center",justifyContent:"center"}}>
                    {m.role==="user"?"👤":"🔆"}
                  </div>
                  <div style={{maxWidth:"78%",background:m.role==="user"?C.cyanFaint:C.bg3,
                    border:`1px solid ${m.role==="user"?C.cyanDim:C.borderLt}`,
                    borderRadius:m.role==="user"?"16px 16px 4px 16px":"16px 16px 16px 4px",
                    padding:"9px 13px",fontSize:13,color:C.textPri,lineHeight:1.65,fontWeight:500}}>
                    {m.content}
                  </div>
                </div>
              ))}
              {chatLoading&&(
                <div style={{display:"flex",gap:8}}>
                  <div style={{width:26,height:26,borderRadius:"50%",background:"linear-gradient(135deg,#4f46e5,#7c3aed)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,flexShrink:0}}>🔆</div>
                  <div style={{background:C.bg3,border:`1px solid ${C.borderLt}`,borderRadius:"16px 16px 16px 4px",padding:"12px 16px",display:"flex",gap:4,alignItems:"center"}}>
                    {[0,1,2].map(i=><span key={i} style={{width:6,height:6,borderRadius:"50%",background:C.cyanDim,animation:`pulse 1.2s ${i*.2}s infinite`}}/>)}
                  </div>
                </div>
              )}
              <div ref={chatEndRef}/>
            </div>
            <div style={{padding:"12px 14px",borderTop:`1px solid ${C.border}`,display:"flex",gap:10,flexShrink:0}}>
              <input value={chatInput} onChange={e=>setChatInput(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&sendChat()}
                placeholder={`Ask Beacon, ${userName}…`}
                style={{...inp,flex:1,borderColor:C.borderLt}}/>
              <button onClick={sendChat} disabled={chatLoading||!chatInput.trim()}
                style={{width:40,height:40,borderRadius:11,border:"none",cursor:chatLoading||!chatInput.trim()?"not-allowed":"pointer",flexShrink:0,
                  background:chatLoading||!chatInput.trim()?C.bg3:"linear-gradient(135deg,#4f46e5,#7c3aed)",
                  display:"flex",alignItems:"center",justifyContent:"center",
                  boxShadow:chatLoading||!chatInput.trim()?"none":"0 4px 14px rgba(124,58,237,0.4)"}}>
                <Send size={14} style={{color:chatLoading||!chatInput.trim()?C.textMute:"#fff"}}/>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESERVE MODAL */}
      {reserving&&(()=>{
        const s=shelters.find(sh=>sh.id===reserving);if(!s)return null;
        const pct=Math.round(((s.capacity-s.reserved)/s.capacity)*100);
        return(
          <div style={{position:"fixed",inset:0,zIndex:50,background:"rgba(0,0,0,0.75)",backdropFilter:"blur(10px)",
            display:"flex",alignItems:"flex-end",justifyContent:"center",padding:16}} onClick={()=>setReserving(null)}>
            <div style={{width:"100%",maxWidth:500,background:C.bg2,borderRadius:28,overflow:"hidden",
              border:`1px solid ${C.borderLt}`,boxShadow:"0 24px 60px rgba(0,0,0,0.8)"}} onClick={e=>e.stopPropagation()}>
              <div style={{background:"linear-gradient(135deg,#083344,#0e4f65)",padding:"16px 20px",
                display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${C.cyanFaint}`}}>
                <div>
                  <div style={{fontWeight:900,color:C.textPri,fontSize:16}}>Reserve Your Spot 🏡</div>
                  <div style={{color:C.cyanDim,fontSize:12,marginTop:2}}>{s.name} · {s.city} · ⛰️ {s.elevation}ft · {pct}% open</div>
                </div>
                <button onClick={()=>setReserving(null)} style={{background:"none",border:"none",cursor:"pointer"}}><X size={18} style={{color:C.textMute}}/></button>
              </div>
              <div style={{padding:18,display:"flex",flexDirection:"column",gap:14}}>
                <div>
                  <label style={{fontSize:11,fontWeight:900,color:C.textMute,textTransform:"uppercase",letterSpacing:1,display:"block",marginBottom:5}}>Your Name</label>
                  <input value={reserveForm.name} onChange={e=>setReserveForm(f=>({...f,name:e.target.value}))} placeholder="Full name" style={inp}/>
                </div>
                <div>
                  <label style={{fontSize:11,fontWeight:900,color:C.textMute,textTransform:"uppercase",letterSpacing:1,display:"block",marginBottom:7}}>Number of People</label>
                  <div style={{display:"flex",gap:8}}>
                    {[1,2,3,4,5,6].map(n=>(
                      <button key={n} onClick={()=>setReserveForm(f=>({...f,people:n}))}
                        style={{width:38,height:38,borderRadius:11,fontWeight:900,fontSize:13,cursor:"pointer",
                          border:`1px solid ${reserveForm.people===n?C.cyanDim:C.borderLt}`,
                          background:reserveForm.people===n?"linear-gradient(135deg,#0891b2,#0e7490)":C.bg3,
                          color:reserveForm.people===n?"#fff":C.textSec}}>{n}</button>
                    ))}
                  </div>
                </div>
                <div style={{display:"flex",gap:10}}>
                  {[["pets","🐾 Pets",C.amber,"#3d2e08"],["medical","🏥 Medical",C.red,"#3d1515"]].map(([k,l,ac,abg])=>(
                    <button key={k} onClick={()=>setReserveForm(f=>({...f,[k]:!f[k]}))}
                      style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"9px",
                        borderRadius:12,border:`1px solid ${reserveForm[k]?ac:C.borderLt}`,
                        background:reserveForm[k]?abg:C.bg3,fontWeight:700,fontSize:12,cursor:"pointer",color:reserveForm[k]?ac:C.textMute}}>{l}</button>
                  ))}
                </div>
                <div style={{display:"flex",gap:10}}>
                  <button onClick={()=>setReserving(null)} style={{flex:1,border:`1px solid ${C.borderLt}`,color:C.textMute,borderRadius:16,padding:"11px",fontWeight:700,fontSize:13,background:"transparent",cursor:"pointer"}}>Cancel</button>
                  <button onClick={confirmReservation} className="bts glow-s"
                    style={{flex:1,borderRadius:16,padding:"11px",fontWeight:900,fontSize:13,border:"none",cursor:"pointer",
                      boxShadow:"0 4px 18px rgba(13,148,136,0.4)",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                    <CheckCircle size={14}/>Confirm Spot
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* SOS MODAL */}
      {sosOpen&&(
        <div style={{position:"fixed",inset:0,zIndex:50,background:"rgba(0,0,0,0.75)",backdropFilter:"blur(10px)",
          display:"flex",alignItems:"flex-end",justifyContent:"center",padding:16}} onClick={()=>setSosOpen(false)}>
          <div style={{width:"100%",maxWidth:500,background:C.bg2,borderRadius:28,overflow:"hidden",
            border:`1px solid ${C.borderLt}`,boxShadow:"0 24px 60px rgba(0,0,0,0.8)"}} onClick={e=>e.stopPropagation()}>
            <div style={{background:"linear-gradient(135deg,#7f1d1d,#991b1b)",padding:"16px 20px",
              display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid #3d1515"}}>
              <div>
                <div style={{fontWeight:900,color:"#fff",fontSize:16}}>Request Help</div>
                <div style={{color:"#fca5a5",fontSize:11,marginTop:2}}>You are not alone, {userName}. Help is closer than you think. 💛</div>
              </div>
              <button onClick={()=>setSosOpen(false)} style={{background:"none",border:"none",cursor:"pointer"}}><X size={18} style={{color:"#fca5a5"}}/></button>
            </div>
            <div style={{padding:18,display:"flex",flexDirection:"column",gap:13}}>
              {location&&<div style={{background:C.cyanFaint,border:`1px solid ${C.cyanDim}40`,borderRadius:12,padding:"8px 12px",fontSize:11,color:C.cyan,fontWeight:700}}>
                📍 Your location will be attached automatically
              </div>}
              <div>
                <label style={{fontSize:11,fontWeight:900,color:C.textMute,textTransform:"uppercase",letterSpacing:1,display:"block",marginBottom:5}}>Your Name</label>
                <input value={sosInput.name} onChange={e=>setSosInput(s=>({...s,name:e.target.value}))} placeholder="First name or anonymous" style={inp}/>
              </div>
              <div>
                <label style={{fontSize:11,fontWeight:900,color:C.textMute,textTransform:"uppercase",letterSpacing:1,display:"block",marginBottom:7}}>What do you need?</label>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:10}}>
                  {[["flood","🌊","Flooding"],["medical","💊","Medical"],["transport","🚗","Ride"],["shelter","🏠","Shelter"],["food","🍞","Food"],["other","📌","Other"]].map(([v,ic,l])=>(
                    <button key={v} onClick={()=>setSosInput(s=>({...s,category:v}))}
                      style={{borderRadius:12,padding:"9px 4px",fontSize:12,fontWeight:700,cursor:"pointer",
                        border:`1px solid ${sosInput.category===v?"#dc2626":C.borderLt}`,
                        background:sosInput.category===v?"rgba(30,7,7,0.8)":C.bg3,
                        color:sosInput.category===v?C.red:C.textMute,
                        display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                      <span style={{fontSize:18}}>{ic}</span>{l}
                    </button>
                  ))}
                </div>
                <textarea value={sosInput.need} onChange={e=>setSosInput(s=>({...s,need:e.target.value}))}
                  placeholder="Describe your situation…" rows={3} style={{...inp,resize:"none"}}/>
              </div>
              <div style={{display:"flex",gap:10}}>
                <button onClick={()=>setSosOpen(false)} style={{flex:1,border:`1px solid ${C.borderLt}`,color:C.textMute,borderRadius:16,padding:"11px",fontWeight:700,fontSize:13,background:"transparent",cursor:"pointer"}}>Cancel</button>
                <button onClick={submitSOS}
                  style={{flex:1,borderRadius:16,padding:"11px",fontWeight:900,fontSize:13,border:"none",cursor:"pointer",
                    background:"linear-gradient(135deg,#dc2626,#b91c1c)",color:"#fff",
                    boxShadow:"0 4px 16px rgba(220,38,38,0.4)",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                  <Send size={13}/>Send Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
