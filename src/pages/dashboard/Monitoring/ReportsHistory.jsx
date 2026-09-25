import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../../components/DashboardLayout/DashboardLayout";
import { getReportLookups, getReports } from "../../../api/reports";
import "./ReportsHistory.css";

const PAGE_SIZE = 9;
const valueOf = (item) => item?.value || item;
const labelOf = (item) => item?.label || item;
const normalize = (value) => String(value || "").toLowerCase().replace(/[\s-]+/g, "_");
const prettifyStatus = (status) => normalize(status).split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ").replace(/^On Hold$/i, "On-Hold");
const displayStatus = (status, statuses = []) => {
  const match = statuses.find((s) => valueOf(s) === status || labelOf(s) === status);
  return match ? labelOf(match) : (status ? prettifyStatus(status) : "—");
};

function SearchIcon(){return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>}
function FilterIcon(){return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M7 12h10M10 18h4"/></svg>}

export default function ReportsHistory(){
  const [lookups,setLookups]=useState({categories:[],statuses:[],severities:[]});
  const [reports,setReports]=useState([]);const [count,setCount]=useState(0);const [totalPages,setTotalPages]=useState(1);const [page,setPage]=useState(1);const [loading,setLoading]=useState(false);const [error,setError]=useState("");
  const empty={category:"",severity:"",status:"",search:"",fromDate:"",toDate:""};
  const [filters,setFilters]=useState(empty);const [draft,setDraft]=useState(empty);
  useEffect(()=>{getReportLookups().then(setLookups).catch(()=>{});},[]);
  useEffect(()=>{(async()=>{try{setLoading(true);setError("");const data=await getReports({q:filters.search||undefined,category_id:filters.category||undefined,severity:filters.severity||undefined,status:filters.status||undefined,from_date:filters.fromDate||undefined,to_date:filters.toDate||undefined,exclude_closed:false,page,page_size:PAGE_SIZE});setReports(data.results||[]);setCount(data.count||0);setTotalPages(Math.max(1,data.total_pages||1));}catch(err){setError(err?.detail||err?.message||"Unable to load report history.");}finally{setLoading(false);}})();},[page,filters]);
  const set=(key,value)=>setDraft(v=>({...v,[key]:value}));
  const apply=()=>{setPage(1);setFilters(draft)};const reset=()=>{setPage(1);setDraft(empty);setFilters(empty)};
  return <DashboardLayout title="Report History"><div className="section-header"><h2 className="section-title">Report History Overview</h2><p className="section-subtitle">View historical logs and status updates for all submitted reports.</p></div>
    <div className="filters-section"><div className="filters-row"><div className="filter-group"><label>Category</label><select value={draft.category} onChange={e=>set("category",e.target.value)}><option value="">All Categories</option>{lookups.categories.map(c=><option key={c.hazard_id} value={c.hazard_id}>{c.hazard_name}</option>)}</select></div><div className="filter-group"><label>Severity</label><select value={draft.severity} onChange={e=>set("severity",e.target.value)}><option value="">All Severities</option>{lookups.severities.map(s=><option key={valueOf(s)} value={valueOf(s)}>{labelOf(s)}</option>)}</select></div><div className="filter-group"><label>Status</label><select value={draft.status} onChange={e=>set("status",e.target.value)}><option value="">All Statuses</option>{lookups.statuses.map(s=><option key={valueOf(s)} value={valueOf(s)}>{labelOf(s)}</option>)}</select></div><div className="filter-group filter-search"><label>Search</label><div className="search-wrap"><SearchIcon/><input placeholder="Search" value={draft.search} onChange={e=>set("search",e.target.value)} onKeyDown={e=>e.key==="Enter"&&apply()}/></div></div></div>
      <div className="filters-row filter-bottom"><div className="filter-group"><label>Date Range</label><div className="date-range"><span>From</span><input type="date" value={draft.fromDate} onChange={e=>set("fromDate",e.target.value)}/><span>to</span><input type="date" value={draft.toDate} onChange={e=>set("toDate",e.target.value)}/></div></div><div className="filter-actions"><button className="btn-apply" onClick={apply}><FilterIcon/>Apply Filters</button><button className="btn-reset" onClick={reset}>Reset</button></div></div></div>
      {error&&<div className="form-error">{typeof error==="string"?error:JSON.stringify(error)}</div>}
      <div className="table-container"><table className="reports-table"><thead><tr><th>REPORT ID</th><th>CATEGORY</th><th>LOCATION</th><th>DATE REPORTED</th><th>STATUS</th><th>SEVERITY</th><th>ACTION</th></tr></thead><tbody>{loading?<tr><td colSpan="7" className="empty-table-message">Loading reports...</td></tr>:reports.length?reports.map(report=><tr key={report.report_number}><td className="report-number">{report.report_number}</td><td>{report.category}</td><td>{report.address||"—"}</td><td>{new Date(report.created_at).toLocaleDateString()}</td><td><span className={`status-badge status-${normalize(report.status)}`}>{displayStatus(report.status, lookups.statuses)}</span></td><td><span className={`severity-badge severity-${String(report.severity||"").toLowerCase()}`}>{report.severity||"—"}</span></td><td><Link to={`/dashboard/monitoring/report-details?report=${encodeURIComponent(report.report_number)}`} className="action-link">View Details</Link></td></tr>):<tr><td colSpan="7" className="empty-table-message">No reports found.</td></tr>}</tbody></table></div>
      <div className="pagination"><span>Showing {reports.length?((page-1)*PAGE_SIZE)+1:0} to {Math.min(page*PAGE_SIZE,count)} of {count} reports</span><div><button disabled={page<=1} onClick={()=>setPage(p=>p-1)}>Previous</button><button disabled={page>=totalPages} onClick={()=>setPage(p=>p+1)}>Next</button></div></div>
  </DashboardLayout>
}