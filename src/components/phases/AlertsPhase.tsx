import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ChevronDown, ChevronRight, Edit2, Trash2, Map, X, Check } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '../ui/sheet';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Checkbox } from '../ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command';
import svgPaths from '../../imports/svg-7hg6d30srz';

interface AlertsPhaseProps {
  data: Record<string, any>;
  onDataChange: (data: Record<string, any>) => void;
  onComplete: () => void;
  onPrevious?: () => void;
  onZoomToLocation?: (center: string, scale: string) => void;
  onAddAIContext?: (itemName: string) => void;
}

type Severity = 'Info' | 'Advisory' | 'Watch' | 'Warning';

interface AlertItem {
  id: string;
  title: string;
  source: string;
  severity: Severity;
  issuedAt: string;   // ISO
  expiresAt?: string; // ISO
  status: 'Active' | 'Cleared' | 'Expired';
  description: string;
  recipients?: string[]; // User emails/IDs
  scheduledTime?: string; // ISO timestamp
  channels?: string[]; // Communication channels
  timeSent?: string; // ISO timestamp
  sentBy?: string; // Name or email of sender
  location?: string; // Location where alert applies
}

export function AlertsPhase({ data, onDataChange, onZoomToLocation, onAddAIContext }: AlertsPhaseProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedAlerts, setExpandedAlerts] = useState<Set<string>>(new Set());
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingAlertId, setEditingAlertId] = useState<string | null>(null);

  const [alerts, setAlerts] = useState<AlertItem[]>(
    data.alerts || [
      {
        id: 'al1',
        title: 'Small Craft Advisory – Gale conditions possible',
        source: 'NOAA/NWS',
        severity: 'Advisory',
        issuedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        expiresAt: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
        status: 'Active',
        description: 'Sustained winds 25–33 kt and seas 7–10 ft possible in the outer coastal waters. Mariners should exercise caution; consider delaying small craft operations.',
        timeSent: new Date(Date.now() - 55 * 60 * 1000).toISOString(),
        sentBy: 'j.martinez@uscg.mil',
        location: 'Gulf Coast Outer Waters'
      },
      {
        id: 'al2',
        title: 'Port Condition Yankee – Reduced operations',
        source: 'USCG COTP',
        severity: 'Watch',
        issuedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        status: 'Active',
        description: 'Port Condition YANKEE has been set. Terminal operations are curtailed; ensure vessels are prepared to depart or take safe refuge. Submit updated port status within 2 hours.',
        timeSent: new Date(Date.now() - 115 * 60 * 1000).toISOString(),
        sentBy: 'm.rodriguez@uscg.mil',
        location: 'Houston Ship Channel'
      },
      {
        id: 'al3',
        title: 'Air Quality Alert – Sensitive groups affected',
        source: 'State Environmental Agency',
        severity: 'Info',
        issuedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        status: 'Active',
        description: 'PM2.5 levels elevated near industrial corridors and along the waterfront. Sensitive groups should limit prolonged outdoor exertion.',
        timeSent: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        sentBy: 's.johnson@uscg.mil',
        location: 'LA/Long Beach Port Area'
      }
    ]
  );

  const [formData, setFormData] = useState<AlertItem>({
    id: '',
    title: '',
    source: '',
    severity: 'Info',
    issuedAt: new Date().toISOString(),
    expiresAt: '',
    status: 'Active',
    description: '',
    recipients: [],
    scheduledTime: new Date().toISOString(),
    channels: [],
  });

  // State for recipient popovers
  const [individualsPopoverOpen, setIndividualsPopoverOpen] = useState(false);
  const [teamsPopoverOpen, setTeamsPopoverOpen] = useState(false);
  
  // State for send timing mode
  const [sendTimingMode, setSendTimingMode] = useState<'now' | 'scheduled'>('scheduled');

  // State for keep message same across channels
  const [keepMessageSame, setKeepMessageSame] = useState(true);
  
  // State for active message tab
  const [activeMessageTab, setActiveMessageTab] = useState<string>('');
  
  // State for channel-specific messages
  const [channelMessages, setChannelMessages] = useState<Record<string, string>>({});

  // Set active tab when channels change
  useEffect(() => {
    if (formData.channels && formData.channels.length > 0) {
      // Set to first channel if no active tab or active tab is not in selected channels
      if (!activeMessageTab || !formData.channels.includes(activeMessageTab)) {
        setActiveMessageTab(formData.channels[0]);
      }
    }
  }, [formData.channels, activeMessageTab]);

  // Available communication channels
  const communicationChannels = [
    { id: 'email', label: 'Email', icon: '📧' },
    { id: 'sms', label: 'SMS', icon: '💬' },
    { id: 'push', label: 'Push Notification', icon: '🔔' },
    { id: 'teams', label: 'Microsoft Teams', icon: '💼' },
  ];

  // Available individuals for recipient selection
  const availableIndividuals = [
    'john.smith@uscg.mil',
    'sarah.johnson@uscg.mil',
    'mike.williams@noaa.gov',
    'lisa.chen@epa.gov',
    'david.rodriguez@uscg.mil',
    'emily.davis@state.gov',
    'james.wilson@uscg.mil',
    'maria.garcia@noaa.gov',
    'robert.brown@uscg.mil',
    'jennifer.taylor@noaa.gov',
    'michael.anderson@epa.gov',
    'patricia.martinez@state.gov',
  ];

  // Available teams for recipient selection
  const availableTeams = [
    'Operations Section',
    'Planning Section',
    'Logistics Section',
    'Finance/Admin Section',
    'Incident Command Team',
    'Marine Branch',
    'Safety Officers',
    'Public Information Team',
    'Liaison Officers',
    'Environmental Unit',
    'Response Coordinators',
    'Field Operations Team',
  ];

  // Helper functions for recipients
  const toggleRecipient = (recipient: string) => {
    const recipients = formData.recipients || [];
    if (recipients.includes(recipient)) {
      setFormData({ ...formData, recipients: recipients.filter(r => r !== recipient) });
    } else {
      setFormData({ ...formData, recipients: [...recipients, recipient] });
    }
  };

  const removeRecipient = (recipient: string) => {
    setFormData({ ...formData, recipients: formData.recipients?.filter(r => r !== recipient) || [] });
  };

  const toggleChannel = (channelId: string) => {
    const channels = formData.channels || [];
    if (channels.includes(channelId)) {
      setFormData({ ...formData, channels: channels.filter(c => c !== channelId) });
    } else {
      setFormData({ ...formData, channels: [...channels, channelId] });
    }
  };

  // Get map coordinates for each alert based on alert type and content
  const getAlertCoordinates = (alertId: string): { center: string; scale: string } => {
    switch (alertId) {
      case 'al1': // Small Craft Advisory - outer coastal waters
        return { center: '-74.2,40.5', scale: '288895.277144' }; // New York/New Jersey coastal waters
      case 'al2': // Port Condition Yankee - major port
        return { center: '-95.2631,29.7604', scale: '144447.638572' }; // Houston Ship Channel
      case 'al3': // Air Quality Alert - industrial/waterfront area
        return { center: '-118.2437,33.7701', scale: '144447.638572' }; // LA/Long Beach port area
      default:
        return { center: '-74.006,40.7128', scale: '144447.638572' }; // Default to NYC area
    }
  };

  const formatDateDisplay = (iso?: string) => {
    if (!iso) return '-';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '-';
    return `${d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })} ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
  };

  const formatMilitaryTimeUTC = (iso?: string) => {
    if (!iso) return '-';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '-';
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    const hours = String(d.getUTCHours()).padStart(2, '0');
    const minutes = String(d.getUTCMinutes()).padStart(2, '0');
    return `${month}/${day}/${year} ${hours}:${minutes} UTC`;
  };

  const persist = (items: AlertItem[]) => {
    setAlerts(items);
    onDataChange({ ...data, alerts: items });
  };

  const toggleAlert = (id: string) => {
    setExpandedAlerts(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const openAddAlert = () => {
    setEditingAlertId(null);
    setFormData({
      id: '',
      title: '',
      source: 'Manual Alert',
      severity: 'Info',
      issuedAt: new Date().toISOString(),
      expiresAt: '',
      status: 'Active',
      description: '',
      recipients: [],
      scheduledTime: new Date().toISOString(),
      channels: [],
    });
    setSendTimingMode('scheduled');
    setIsSheetOpen(true);
  };

  const openEditAlert = (id: string) => {
    const a = alerts.find(x => x.id === id);
    if (!a) return;
    setEditingAlertId(id);
    setFormData({ ...a });
    setSendTimingMode(a.scheduledTime ? 'scheduled' : 'now');
    setIsSheetOpen(true);
  };

  const deleteAlert = (id: string) => {
    persist(alerts.filter(a => a.id !== id));
  };

  const saveAlert = () => {
    if (!formData.title) {
      return;
    }
    
    // Update scheduledTime based on send timing mode
    const updatedFormData = {
      ...formData,
      scheduledTime: sendTimingMode === 'now' ? new Date().toISOString() : formData.scheduledTime
    };
    
    if (editingAlertId) {
      persist(alerts.map(a => (a.id === editingAlertId ? { ...updatedFormData, id: editingAlertId } : a)));
    } else {
      const id = `${Date.now()}`;
      persist([...alerts, { ...updatedFormData, id, source: 'Manual Alert' }]);
    }
    setIsSheetOpen(false);
    setEditingAlertId(null);
  };

  const filtered = alerts.filter(a => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return (
      a.title.toLowerCase().includes(s) ||
      (a.sentBy && a.sentBy.toLowerCase().includes(s)) ||
      a.severity.toLowerCase().includes(s) ||
      a.status.toLowerCase().includes(s)
    );
  });

  const severityColor = (sev: Severity) => {
    switch (sev) {
      case 'Warning': return '#EF4444';
      case 'Watch': return '#F59E0B';
      case 'Advisory': return '#3B82F6';
      default: return '#6e757c';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header - similar to Resources */}
      <div className="sticky top-0 z-10 bg-[#222529] rounded-lg border border-[#6e757c] relative">
        <div className="flex items-center justify-between px-[13px] py-3 w-full border-b-2 border-border rounded-t-lg rounded-b-none">
          <div className="flex items-center gap-4">
            <p className="caption text-nowrap text-white whitespace-pre">Alerts</p>
            <div className="relative h-[26px] w-[195px]">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search"
                className="box-border w-full h-[26px] bg-transparent border border-[#6e757c] rounded-[4px] px-[26px] py-[3.25px] caption text-white placeholder:text-[#6e757c] focus:outline-none focus:border-accent"
              />
              <div className="absolute left-[8px] size-[11.375px] top-[7.44px] pointer-events-none">
                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 12">
                  <g>
                    <path d={svgPaths.p3a3bec00} stroke="#6E757C" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.710938" />
                    <path d={svgPaths.p380aaa80} stroke="#6E757C" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.710938" />
                  </g>
                </svg>
              </div>
            </div>
          </div>
          <button
            onClick={openAddAlert}
            className="bg-[#01669f] h-[22.75px] rounded-[4px] w-[130.625px] hover:bg-[#01669f]/90 transition-colors flex items-center justify-center relative"
          >
            <div className="absolute left-[16px] size-[13px]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13 13">
                <g>
                  <path d="M2.70833 6.5H10.2917" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.08333" />
                  <path d="M6.5 2.70833V10.2917" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.08333" />
                </g>
              </svg>
            </div>
            <p className="caption text-nowrap text-white ml-[21px]">Add Alert</p>
          </button>
        </div>
      </div>

      {/* Alerts List - similar card layout to Resources */}
      <div className="space-y-4">
        {filtered.map((a) => {
          const isExpanded = expandedAlerts.has(a.id);
          return (
            <div
              key={a.id}
              className="border border-border rounded-lg overflow-hidden"
              style={{ background: 'linear-gradient(90deg, rgba(2, 163, 254, 0.08) 0%, rgba(0, 0, 0, 0) 100%), linear-gradient(90deg, rgb(20, 23, 26) 0%, rgb(20, 23, 26) 100%)' }}
            >
              <div className={`p-3 ${isExpanded ? 'border-b border-border' : ''}`}>
                <div className="flex items-start justify-between">
                  <div
                    className="flex items-start gap-2 flex-1 cursor-pointer"
                    onClick={() => {
                      toggleAlert(a.id);
                      if (onAddAIContext) {
                        onAddAIContext(a.title);
                      }
                    }}
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <span className="caption text-white">{a.title}</span>
                      {!isExpanded && (
                        <div className="flex items-center gap-3 mt-1">
                          <span className="caption text-white">{a.sentBy}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: severityColor(a.severity) }} />
                            <span className="caption" style={{ color: severityColor(a.severity) }}>{a.severity}</span>
                          </div>
                          <span className="caption text-white">{formatMilitaryTimeUTC(a.timeSent)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Zoom to alert location
                        if (onZoomToLocation) {
                          const coords = getAlertCoordinates(a.id);
                          onZoomToLocation(coords.center, coords.scale);
                        }
                      }}
                      className="p-1 hover:bg-muted/30 rounded transition-colors"
                      title="Zoom to alert location"
                    >
                      <Map className="w-3 h-3 text-white" />
                    </button>
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="p-4 space-y-4 bg-card/50">
                  {a.description && (
                    <div>
                      <label className="text-white mb-1 block">Description</label>
                      <p className="caption text-white">{a.description}</p>
                    </div>
                  )}
                  
                  {/* Recipients section */}
                  {a.recipients && a.recipients.length > 0 && (
                    <div>
                      <label className="text-white mb-1 block">Recipients</label>
                      <div className="flex flex-wrap gap-2">
                        {a.recipients.map((recipient) => (
                          <span 
                            key={recipient}
                            className="caption text-white bg-accent/20 px-2 py-1 rounded text-xs"
                          >
                            {recipient}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Scheduled time */}
                  {a.scheduledTime && (
                    <div>
                      <label className="text-white mb-1 block">Scheduled Send Time</label>
                      <p className="caption text-white">{formatDateDisplay(a.scheduledTime)}</p>
                    </div>
                  )}

                  {/* Channels */}
                  {a.channels && a.channels.length > 0 && (
                    <div>
                      <label className="text-white mb-1 block">Communication Channels</label>
                      <div className="flex flex-wrap gap-2">
                        {a.channels.map((channelId) => {
                          const channel = communicationChannels.find(c => c.id === channelId);
                          return channel ? (
                            <span 
                              key={channelId}
                              className="caption text-white bg-primary/20 px-2 py-1 rounded text-xs"
                            >
                              {channel.label}
                            </span>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-white mb-1 block">Severity</label>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: severityColor(a.severity) }} />
                        <span className="caption text-white">{a.severity}</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-white mb-1 block">Expires</label>
                      <p className="caption text-white">{formatDateDisplay(a.expiresAt)}</p>
                    </div>
                    <div>
                      <label className="text-white mb-1 block">Status</label>
                      <p className="caption text-white">{a.status}</p>
                    </div>
                    {a.location && (
                      <div>
                        <label className="text-white mb-1 block">Location</label>
                        <p className="caption text-white">{a.location}</p>
                      </div>
                    )}
                    {a.timeSent && (
                      <div>
                        <label className="text-white mb-1 block">Time Sent</label>
                        <p className="caption text-white">{formatDateDisplay(a.timeSent)}</p>
                      </div>
                    )}
                    {a.sentBy && (
                      <div>
                        <label className="text-white mb-1 block">Sent By</label>
                        <p className="caption text-white">{a.sentBy}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add/Edit Alert Side Panel */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-[640px] bg-card overflow-y-auto px-6">
          <SheetHeader>
            <SheetTitle>{editingAlertId ? 'Edit Alert' : 'Schedule Alert'}</SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-6 pb-6">
            {/* Communication Channels */}
            <div className="space-y-2">
              <Label className="text-foreground">Communication Channels <span className="text-destructive">*</span></Label>
              <div className="flex flex-wrap gap-3">
                {communicationChannels.map((channel) => {
                  const isSelected = formData.channels?.includes(channel.id);
                  return (
                    <label
                      key={channel.id}
                      className={`flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg border border-border transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#01476f]'
                          : 'hover:bg-muted/20'
                      }`}
                    >
                      {/* Checkbox */}
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleChannel(channel.id)}
                      />
                      
                      {/* Icon */}
                      <div className="w-6 h-6 flex items-center justify-center">
                        {channel.id === 'email' && (
                          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                            <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" fill="white"/>
                          </svg>
                        )}
                        {channel.id === 'sms' && (
                          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                            <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM9 11H7V9h2v2zm4 0h-2V9h2v2zm4 0h-2V9h2v2z" fill="white"/>
                          </svg>
                        )}
                        {channel.id === 'push' && (
                          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                            <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" fill="white"/>
                          </svg>
                        )}
                        {channel.id === 'voice' && (
                          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                            <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" fill="white"/>
                          </svg>
                        )}
                      </div>
                      <span className="text-white text-xs font-semibold whitespace-nowrap">
                        {channel.label}
                      </span>
                      {/* Info icon */}
                      <div className="w-2.5 h-2.5 bg-white/50 rounded-full"></div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              {/* Keep message same checkbox */}
              <div className="flex items-center gap-2 pb-2">
                <Checkbox
                  id="keep-message-same"
                  checked={keepMessageSame}
                  onCheckedChange={(checked) => setKeepMessageSame(checked as boolean)}
                  className="border-border"
                />
                <label
                  htmlFor="keep-message-same"
                  className="text-sm cursor-pointer text-foreground"
                >
                  Keep message the same across all channels
                </label>
              </div>
              
              <Label className="text-foreground">Alert Message <span className="text-destructive">*</span></Label>
              
              {/* Show tabs when channels are selected */}
              {formData.channels && formData.channels.length > 0 && (
                <div className="flex gap-2 mb-3">
                  {formData.channels.map((channelId) => {
                    const channel = communicationChannels.find(c => c.id === channelId);
                    if (!channel) return null;
                    return (
                      <button
                        key={channelId}
                        type="button"
                        onClick={() => setActiveMessageTab(channelId)}
                        className={`px-4 py-2 text-sm font-medium transition-colors rounded ${
                          activeMessageTab === channelId
                            ? 'bg-accent text-white'
                            : 'text-white hover:bg-muted/20'
                        }`}
                      >
                        {channel.label}
                      </button>
                    );
                  })}
                </div>
              )}
              
              {/* Message field - shared or channel-specific */}
              {formData.channels && formData.channels.length > 0 ? (
                keepMessageSame ? (
                  <Textarea 
                    value={formData.title} 
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })} 
                    placeholder="Enter alert message (will be sent to all selected channels)..."
                    rows={3}
                    className="bg-input-background border-border resize-none" 
                  />
                ) : (
                  formData.channels.map((channelId) => {
                    const channel = communicationChannels.find(c => c.id === channelId);
                    if (!channel || activeMessageTab !== channelId) return null;
                    return (
                      <Textarea
                        key={channelId}
                        value={channelMessages[channelId] || ''}
                        onChange={(e) => setChannelMessages(prev => ({ ...prev, [channelId]: e.target.value }))}
                        placeholder={`Enter custom message for ${channel.label}...`}
                        rows={3}
                        className="bg-input-background border-border resize-none"
                      />
                    );
                  })
                )
              ) : (
                <p className="text-sm text-muted-foreground p-3 border border-border rounded bg-input-background">
                  Please select at least one communication channel above to compose your message.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">Recipients <span className="text-destructive">*</span></Label>
              <div className="space-y-3">
                {/* Individuals Multi-Select Dropdown */}
                <div className="space-y-2">
                  <Label className="text-sm text-foreground">Individuals</Label>
                  <Popover open={individualsPopoverOpen} onOpenChange={setIndividualsPopoverOpen}>
                    <PopoverTrigger asChild>
                      <button
                        className="w-full flex items-center justify-between bg-input-background border border-border rounded-md px-3 py-2 text-sm hover:bg-accent/5"
                      >
                        <span className="text-muted-foreground">
                          {formData.recipients?.filter(r => availableIndividuals.includes(r)).length || 0} selected
                        </span>
                        <ChevronDown className="h-4 w-4 opacity-50" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0 bg-card border-border" align="start">
                      <Command className="bg-card">
                        <CommandInput 
                          placeholder="Search individuals..." 
                          className="h-9"
                        />
                        <CommandList>
                          <CommandEmpty>No individual found.</CommandEmpty>
                          <CommandGroup>
                            {availableIndividuals.map((individual) => (
                              <CommandItem
                                key={individual}
                                value={individual}
                                onSelect={() => toggleRecipient(individual)}
                                className="cursor-pointer"
                              >
                                <Checkbox
                                  checked={formData.recipients?.includes(individual)}
                                  className="mr-2"
                                />
                                {individual}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {/* Selected individuals tags */}
                  {formData.recipients?.filter(r => availableIndividuals.includes(r)).length > 0 && (
                    <div className="flex flex-wrap gap-2 p-2 bg-input-background border border-border rounded-md">
                      {formData.recipients
                        .filter(r => availableIndividuals.includes(r))
                        .map((individual) => (
                          <div 
                            key={individual}
                            className="flex items-center gap-1 bg-accent/20 text-accent px-2 py-1 rounded text-xs"
                          >
                            <span>{individual}</span>
                            <button
                              onClick={() => removeRecipient(individual)}
                              className="hover:bg-accent/30 rounded p-0.5"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                {/* Teams Multi-Select Dropdown */}
                <div className="space-y-2">
                  <Label className="text-sm text-foreground">Teams</Label>
                  <Popover open={teamsPopoverOpen} onOpenChange={setTeamsPopoverOpen}>
                    <PopoverTrigger asChild>
                      <button
                        className="w-full flex items-center justify-between bg-input-background border border-border rounded-md px-3 py-2 text-sm hover:bg-accent/5"
                      >
                        <span className="text-muted-foreground">
                          {formData.recipients?.filter(r => availableTeams.includes(r)).length || 0} selected
                        </span>
                        <ChevronDown className="h-4 w-4 opacity-50" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0 bg-card border-border" align="start">
                      <Command className="bg-card">
                        <CommandInput 
                          placeholder="Search teams..." 
                          className="h-9"
                        />
                        <CommandList>
                          <CommandEmpty>No team found.</CommandEmpty>
                          <CommandGroup>
                            {availableTeams.map((team) => (
                              <CommandItem
                                key={team}
                                value={team}
                                onSelect={() => toggleRecipient(team)}
                                className="cursor-pointer"
                              >
                                <Checkbox
                                  checked={formData.recipients?.includes(team)}
                                  className="mr-2"
                                />
                                {team}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {/* Selected teams tags */}
                  {formData.recipients?.filter(r => availableTeams.includes(r)).length > 0 && (
                    <div className="flex flex-wrap gap-2 p-2 bg-input-background border border-border rounded-md">
                      {formData.recipients
                        .filter(r => availableTeams.includes(r))
                        .map((team) => (
                          <div 
                            key={team}
                            className="flex items-center gap-1 bg-accent/20 text-accent px-2 py-1 rounded text-xs"
                          >
                            <span>{team}</span>
                            <button
                              onClick={() => removeRecipient(team)}
                              className="hover:bg-accent/30 rounded p-0.5"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">Scheduled Time <span className="text-destructive">*</span></Label>
              <div className="flex w-full border border-border bg-input-background rounded-md overflow-hidden">
                <button
                  type="button"
                  onClick={() => setSendTimingMode('now')}
                  className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                    sendTimingMode === 'now'
                      ? 'bg-[#01669f] text-white'
                      : 'bg-transparent text-foreground hover:bg-muted/50'
                  }`}
                >
                  Send alert now
                </button>
                <button
                  type="button"
                  onClick={() => setSendTimingMode('scheduled')}
                  className={`flex-1 px-4 py-2 text-sm font-medium transition-colors border-l border-border ${
                    sendTimingMode === 'scheduled'
                      ? 'bg-[#01669f] text-white'
                      : 'bg-transparent text-foreground hover:bg-muted/50'
                  }`}
                >
                  Schedule alert
                </button>
              </div>
              
              {sendTimingMode === 'scheduled' && (
                <div className="mt-3">
                  <Input 
                    type="datetime-local"
                    value={formData.scheduledTime ? new Date(formData.scheduledTime).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setFormData({ ...formData, scheduledTime: new Date(e.target.value).toISOString() })}
                    className="bg-input-background border-border" 
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">Severity</Label>
              <Select value={formData.severity} onValueChange={(value) => setFormData({ ...formData, severity: value as Severity })}>
                <SelectTrigger className="bg-input-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Info">Info</SelectItem>
                  <SelectItem value="Advisory">Advisory</SelectItem>
                  <SelectItem value="Watch">Watch</SelectItem>
                  <SelectItem value="Warning">Warning</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">Location</Label>
              <Input 
                value={formData.location || ''} 
                onChange={(e) => setFormData({ ...formData, location: e.target.value })} 
                placeholder="Enter location..."
                className="bg-input-background border-border" 
              />
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">Additional Details</Label>
              <Textarea 
                value={formData.description} 
                onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                placeholder="Add any additional context or instructions..."
                className="bg-input-background border-border min-h-[120px] resize-none" 
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={saveAlert} className="flex-1 bg-primary hover:bg-primary/90">
                {editingAlertId ? 'Update Alert' : 'Schedule Alert'}
              </Button>
              <Button onClick={() => setIsSheetOpen(false)} variant="outline" className="flex-1 border-border">
                Cancel
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

