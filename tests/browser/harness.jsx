// Test-only fixtures: no Firebase connection and no seeded production data.
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import CalendarView from '../../src/components/CalendarView';
import MaterialsView from '../../src/components/MaterialsView';
import SiteDiaryView from '../../src/components/SiteDiaryView';
import MonitoringView from '../../src/components/MonitoringView';
import InspectionsView from '../../src/components/InspectionsView';
import UserManagementView from '../../src/components/UserManagementView';
import LiftingView from '../../src/components/LiftingView';
import ProjectSelection from '../../src/components/ProjectSelection';
import ExecutiveReportModal from '../../src/components/ExecutiveReportModal';
import WorkspaceShell from '../../src/components/WorkspaceShell';
import PMCommandDashboard from '../../src/components/PMCommandDashboard';
import AccountControls from '../../src/components/AccountControls';
import DeletionReviewPanel from '../../src/components/DeletionReviewPanel';
import { RecordDeletionContext } from '../../src/contexts/RecordDeletionContext';
import { canRequestDeletion, canReviewDeletion, deletionKey, isDeletionAdmin, recordLabel } from '../../src/utils/deletions';
import '../../src/index.css';

export default function Harness() {
  const query = new URLSearchParams(window.location.search);
  const [role, setRole] = useState(query.get('role') || 'admin');
  const [view, setView] = useState(query.get('view') || 'calendar');
  const [accountProfile, setAccountProfile] = useState({name:'Test person',role:'Site engineer',phone:'',birthday:''});
  const [accountAction, setAccountAction] = useState('');
  const [requests, setRequests] = useState([]), [brief, setBrief] = useState(false);
  const creator = 'fixture@example.test';
  const [data, setData] = useState(() => ({
    tasks: query.get('legacy') || query.get('seed') ? [{id:'legacy',activity:'Existing sprint task',status:'in_progress',zone:'East',createdBy:creator}] : [],
    materials: query.get('seed') ? [{id:'test-do',reference:'DO-001',type:'Delivery Order',element:'Rebar delivery',quantity:2,unit:'t',supplier:'Supplier',zone:'East',status:'Received',createdBy:creator,deliveryDate:'2026-10-01',actualDate:'2026-10-01'}] : [],
    lifts: query.get('seed') ? [{id:'test-ptw',crane:'Crane PTW',zone:'East',status:'SUSPENDED',createdBy:creator}] : [],
    diary: [], observations: [], zones:[{id:'east',name:'East',createdBy:creator}],
    inspections:[{id:'TEST-RFI',element:'Test slab',discipline:'Structural',zone:'East',createdBy:creator,stage:Number(query.get('stage') || 0),comments:[],history:[]}],
    users:[{id:'person@example.test',email:'person@example.test',name:'Test member',systemRole:'guest',organization:'Original organisation',createdBy:creator}],
  }));
  const [access, setAccess] = useState({'fixture-project':[{id:'requester@example.test',email:'requester@example.test',name:'New requester',systemRole:'pending',createdBy:'requester@example.test'}],'second-project':[]});
  const [accessProjectId, setAccessProjectId] = useState('fixture-project');
  const currentUser = {email:query.get('email') || creator,uid:`fixture-${role}`,systemRole:role};
  const accountUser = {...currentUser,displayName:accountProfile.name,emailVerified:true};
  const fail = () => {if(query.get('fail'))throw new Error('Test write rejected');};
  const add = key => async value => {fail();setData(prev=>({...prev,[key]:[...prev[key],{...value,id:crypto.randomUUID(),createdBy:currentUser.email}]}));};
  const update = key => async (id,value) => {fail();setData(prev=>({...prev,[key]:prev[key].map(record=>record.id===id?{...record,...value}:record)}));};
  const remove = (collection,id) => setData(prev=>({...prev,[collection]:prev[collection].filter(record=>record.id!==id)}));
  const context = {
    user:currentUser,requests,records:{...data,weatherLogs:data.diary,monitoring:data.observations,projects:[]},
    submit:async(collection,id,reason)=>{
      fail();const key=deletionKey(collection,id),record=context.records[collection].find(record=>record.id===id);
      if(!isDeletionAdmin(currentUser)&&!canRequestDeletion(currentUser,record))throw new Error('Not your record');
      const status=isDeletionAdmin(currentUser)?'deleted':'pending';
      const request={id:key,targetId:id,targetCollection:collection,targetLabel:recordLabel(record),targetSnapshot:{...record},reason,status,requestedBy:currentUser.email,requestedByUid:currentUser.uid,requestedAt:new Date().toISOString(),history:[]};
      setRequests(prev=>[...prev.filter(item=>item.id!==key),request]);if(status==='deleted')remove(collection,id);
    },
    review:async(key,approve,reason)=>{
      fail();const request=requests.find(item=>item.id===key);
      if(!canReviewDeletion(currentUser,request))throw new Error('Independent verification required');
      setRequests(prev=>prev.map(item=>item.id===key?{...item,status:approve?'approved':'rejected',reviewReason:reason,reviewedBy:currentUser.email}:item));
      if(approve)remove(request.targetCollection,request.targetId);
    },
  };
  const common={currentUser,zones:data.zones,tasks:data.tasks};
  const accountProps={user:accountUser,profile:accountProfile,projectName:'Test project',onProjects:()=>setAccountAction('Project selection opened'),onExecutiveBrief:()=>{setAccountAction('Executive brief opened');setBrief(true);},onLogout:async()=>{fail();setAccountAction('Logged out');},onSaveProfile:async updates=>{fail();setAccountProfile(prev=>({...prev,...updates}));}};
  const views=<>
    {view==='dashboard'&&<PMCommandDashboard onNavigate={setView} inspections={data.inspections} materials={data.materials} lifts={data.lifts}/>}
    {view==='calendar'&&<CalendarView {...common} onAdd={add('tasks')} onUpdate={update('tasks')} materials={data.materials} diary={data.diary} inspections={data.inspections}/>}
    {view==='materials'&&<MaterialsView {...common} materials={data.materials} onAdd={add('materials')} onUpdate={update('materials')}/>}
    {view==='diary'&&<SiteDiaryView {...common} weatherLogs={data.diary} onAddWeatherLog={add('diary')} onUpdate={update('diary')}/>}
    {view==='lifting'&&<LiftingView {...common} lifts={data.lifts} onAdd={add('lifts')} onToggleLift={id=>update('lifts')(id,{status:'ACTIVE'})}/>}
    {view==='monitoring'&&<MonitoringView {...common} observations={data.observations} onAdd={add('observations')}/>}
    {view==='inspections'&&<InspectionsView {...common} inspections={data.inspections} onAdd={add('inspections')} onUpdate={update('inspections')}
      onAdvance={async(id,stage)=>update('inspections')(id,{stage:stage+1,history:[{user:currentUser.email,role,action:'Advanced inspection',timestamp:new Date().toISOString()}]})}
      onComment={async(id,text)=>update('inspections')(id,{comments:[{user:currentUser.email,role,text,timestamp:new Date().toISOString()}]})}/>}
    {view==='users'&&<><UserManagementView currentUser={currentUser} users={data.users} onAddPersonnel={add('users')} onUpdatePersonnelRole={(id,systemRole)=>update('users')(id,{systemRole})} onUpdatePersonnelOrganization={(id,organization)=>update('users')(id,{organization})}/><DeletionReviewPanel/></>}
    {view==='deletions'&&<><label className="block mb-4">Test reviewer account<select value={role} onChange={event=>setRole(event.target.value)}>{['engineer','manager','admin','guest'].map(value=><option key={value}>{value}</option>)}</select></label><DeletionReviewPanel/></>}
  </>;
  const navGroups=[{group:'Executive & Planning',items:[{id:'dashboard',label:'PM Command Center'},{id:'calendar',label:'Site Planning'}]},{group:'Site Execution & QA/QC',items:[{id:'inspections',label:'RE/RTO Inspections (RFI)'},{id:'materials',label:'Materials, BBS & DOs'},{id:'diary',label:'Site Diary'},{id:'lifting',label:'Lifting Plan & PTW Matrix'}]},{group:'System & Access',items:[{id:'users',label:'Role & Subcon Matrix'},...(role==='admin'?[{id:'monitoring',label:'Admin Control Panel'}]:[])]}];
  return <RecordDeletionContext.Provider value={context}>
    {view==='account'?<main className="app-shell p-4 min-h-screen"><header className="h-20 bg-white border-b px-4 flex items-center justify-between gap-3"><h1 className="text-lg font-bold truncate min-w-0">RE/RTO Inspections (RFI)</h1><AccountControls {...accountProps}/></header>{accountAction&&<p role="status">{accountAction}</p>}</main>
      :view==='projects'?<ProjectSelection projects={[{id:'fixture-project',name:'Test project',ownerId:currentUser.uid},{id:'second-project',name:'Second project',ownerId:'someone-else'}]} user={accountUser} isSiteOwner={query.get('siteOwner')!=='false'} onSelect={()=>{}} onAdd={async()=>{}} onDelete={async()=>{fail();}} onLogout={accountProps.onLogout}
        accessControl={{projectId:accessProjectId,onProjectChange:setAccessProjectId,members:{items:access[accessProjectId]},
          onGrant:async(projectId,{email,name,systemRole})=>{fail();const id=email.trim().toLowerCase();const exists=access[projectId].some(m=>m.id===id);setAccess(prev=>({...prev,[projectId]:exists?prev[projectId].map(m=>m.id===id?{...m,systemRole}:m):[...prev[projectId],{id,email:id,name:name||id,systemRole,createdBy:currentUser.email}]}));return exists?'updated':'created';},
          onRoleChange:async(projectId,id,systemRole)=>{fail();setAccess(prev=>({...prev,[projectId]:prev[projectId].map(m=>m.id===id?{...m,systemRole}:m)}));},
          onRevoke:async(projectId,id)=>{fail();setAccess(prev=>({...prev,[projectId]:prev[projectId].filter(m=>m.id!==id)}));}}}/>
      :<WorkspaceShell project={{id:'fixture-project',name:'Test project'}} navGroups={navGroups} activeTab={view} onNavigate={setView} zones={data.zones} selectedZone="All Zones" onZoneChange={()=>{}} onAddZone={()=>{}} canAddZone={['admin','manager','engineer'].includes(role)} isAdmin={role==='admin'} {...accountProps}
        metrics={<>{[['Planning activities',data.tasks.length],['Inspections',data.inspections.length],['Material records',data.materials.length],['Lifting permits',data.lifts.length],['Personnel',data.users.length]].map(([name,value])=><button key={name} className="text-left p-3 rounded-lg border border-slate-200"><span className="text-xs text-slate-600 block">{name}</span><strong className="text-xl">{value}</strong></button>)}</>}>{views}</WorkspaceShell>}
    {brief&&view!=='account'&&<ExecutiveReportModal onClose={()=>setBrief(false)} projectName="Test project" tasks={data.tasks} inspections={data.inspections}/>}
  </RecordDeletionContext.Provider>;
}
createRoot(document.getElementById('root')).render(<Harness/>);
