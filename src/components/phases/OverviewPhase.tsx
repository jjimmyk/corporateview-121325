import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { ChevronDown, ChevronRight, Edit2, Trash2, RefreshCw, Check } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '../ui/sheet';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import svgPaths from '../../imports/svg-7hg6d30srz';

interface OverviewPhaseProps {
  data: Record<string, any>;
  onDataChange: (data: Record<string, any>) => void;
  onComplete: () => void;
  onPrevious?: () => void;
  onAddAIContext?: (itemName: string) => void;
}

type DataSourceStatus = 'Active' | 'Delayed' | 'Offline' | 'Maintenance';

interface DataSourceItem {
  id: string;
  name: string;
  status: DataSourceStatus;
  lastUpdated: string;
  updateFrequency: string;
  provider: string;
  description: string;
  dataTypes: string[];
  coverage: string;
  reliability: string;
  dataSources?: string;
}

export function OverviewPhase({ data, onDataChange, onAddAIContext }: OverviewPhaseProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSources, setExpandedSources] = useState<Set<string>>(new Set());
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingSourceId, setEditingSourceId] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'region' | 'incident'>('region');
  const [selectedRegion, setSelectedRegion] = useState<string>('gulf-coast');
  const [selectedIncident, setSelectedIncident] = useState<string>('oil-spill-alpha');
  const [regionPopoverOpen, setRegionPopoverOpen] = useState(false);
  const [incidentPopoverOpen, setIncidentPopoverOpen] = useState(false);

  // Region options
  const regions = [
    { id: 'gulf-coast', name: 'Gulf Coast Region' },
    { id: 'southeast', name: 'Southeast Region' },
    { id: 'northeast', name: 'Northeast Region' },
    { id: 'west-coast', name: 'West Coast Region' },
    { id: 'great-lakes', name: 'Great Lakes Region' }
  ];

  // Incident options
  const incidents = [
    { id: 'oil-spill-alpha', name: 'Oil Spill Alpha - Gulf Coast Pipeline' },
    { id: 'oil-spill-beta', name: 'Oil Spill Beta - Santa Barbara Platform' },
    { id: 'hurricane-delta', name: 'Hurricane Delta Response' },
    { id: 'wildfire-gamma', name: 'Wildfire Gamma - California' },
    { id: 'flood-epsilon', name: 'Flood Epsilon - Mississippi Basin' }
  ];

  // Function to generate data based on region and incident
  const generateDataForSelection = (region: string, incident: string): DataSourceItem[] => {
    const baseTime = new Date();
    const randomMinutes = () => Math.floor(Math.random() * 15);
    
    const regionCoverage = regions.find(r => r.id === region)?.name || 'Unknown Region';
    const incidentName = incidents.find(i => i.id === incident)?.name || 'Unknown Incident';
    
    return [
      {
        id: 'src1',
        name: 'Current Weather',
        status: 'Active',
        lastUpdated: new Date(baseTime.getTime() - randomMinutes() * 60000).toLocaleString('en-US', { 
          year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false 
        }).replace(',', ''),
        updateFrequency: 'Every 5 minutes',
        provider: 'NOAA National Weather Service',
        description: `Real-time current weather conditions for ${regionCoverage} including temperature, wind speed and direction, humidity, barometric pressure, visibility, precipitation, and current weather phenomena affecting ${incidentName} operations.`,
        dataTypes: ['Temperature', 'Wind Speed/Direction', 'Humidity', 'Pressure', 'Visibility', 'Precipitation', 'Cloud Cover'],
        coverage: regionCoverage,
        reliability: '99.8% uptime',
        dataSources: 'NOAA Weather Stations, NDBC Buoys, FAA AWOS Network, Regional Airports'
      },
      {
        id: 'src2',
        name: 'Forecast Weather',
        status: 'Active',
        lastUpdated: new Date(baseTime.getTime() - randomMinutes() * 60000).toLocaleString('en-US', { 
          year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false 
        }).replace(',', ''),
        updateFrequency: 'Every 6 hours',
        provider: 'NOAA National Weather Service',
        description: `Weather forecasts for ${incidentName} operational planning including 24-hour, 48-hour, and 7-day forecasts, marine forecasts, severe weather outlooks, and extended outlook for response operations in ${regionCoverage}.`,
        dataTypes: ['24-Hour Forecast', '48-Hour Forecast', '7-Day Outlook', 'Marine Forecast', 'Wave Heights', 'Severe Weather Outlook'],
        coverage: regionCoverage,
        reliability: '99.5% uptime',
        dataSources: 'GFS Model, NAM Model, HRRR Model, WRF-ARW, Wave Watch III, NHC Advisories'
      },
      {
        id: 'src3',
        name: 'News',
        status: 'Active',
        lastUpdated: new Date(baseTime.getTime() - randomMinutes() * 60000).toLocaleString('en-US', { 
          year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false 
        }).replace(',', ''),
        updateFrequency: 'Every 15 minutes',
        provider: 'Multi-Source News Aggregator',
        description: `Aggregated news coverage related to ${incidentName} from local, regional, and national news sources including incident-related news stories, press releases, social media monitoring, and public statements affecting ${regionCoverage}.`,
        dataTypes: ['Local News', 'Regional Coverage', 'National Media', 'Press Releases', 'Social Media', 'Public Statements'],
        coverage: `${regionCoverage} - Local, Regional, and National Media`,
        reliability: '99.9% uptime',
        dataSources: 'AP News Wire, Local TV/Radio, Twitter API, Facebook Graph API, RSS Feeds, Press Release Services'
      },
      {
        id: 'src4',
        name: 'Power Outages',
        status: region === 'gulf-coast' && incident === 'hurricane-delta' ? 'Delayed' : 'Active',
        lastUpdated: new Date(baseTime.getTime() - randomMinutes() * 60000).toLocaleString('en-US', { 
          year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false 
        }).replace(',', ''),
        updateFrequency: 'Every 10 minutes',
        provider: 'Regional Utility Companies',
        description: `Real-time power outage tracking for ${regionCoverage} operational area including number of customers affected, outage locations, estimated restoration times, critical infrastructure impacts affecting ${incidentName}.`,
        dataTypes: ['Outage Locations', 'Customers Affected', 'Restoration ETAs', 'Critical Infrastructure', 'Crew Status', 'Substation Status'],
        coverage: `${regionCoverage} Service Areas`,
        reliability: region === 'gulf-coast' && incident === 'hurricane-delta' ? '95.0% uptime' : '98.5% uptime',
        dataSources: 'Utility SCADA Systems, OMS Platforms, Field Crew Reports, Smart Meter Networks, Customer Call Centers'
      },
      {
        id: 'src5',
        name: 'Energy Reliability Index',
        status: 'Active',
        lastUpdated: new Date(baseTime.getTime() - randomMinutes() * 60000).toLocaleString('en-US', { 
          year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false 
        }).replace(',', ''),
        updateFrequency: 'Hourly',
        provider: 'Regional Energy Infrastructure Monitor',
        description: `Comprehensive energy infrastructure reliability metrics for ${regionCoverage} including grid stability indicators, generation capacity, transmission status, fuel supply levels, and backup power availability supporting ${incidentName} operations.`,
        dataTypes: ['Grid Stability', 'Generation Capacity', 'Transmission Status', 'Fuel Supplies', 'Backup Power', 'Critical Facilities'],
        coverage: `${regionCoverage} Energy Infrastructure`,
        reliability: '99.7% uptime',
        dataSources: 'ISO/RTO Data, EIA-930, Generation Telemetry, Pipeline SCADA, Tank Gauging Systems, Generator Status Feeds'
      },
      {
        id: 'src6',
        name: 'Incident Objectives',
        status: 'Active',
        lastUpdated: new Date(baseTime.getTime() - randomMinutes() * 60000).toLocaleString('en-US', { 
          year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false 
        }).replace(',', ''),
        updateFrequency: 'Per Operational Period',
        provider: 'Unified Command - Planning Section',
        description: `Current operational period incident objectives for ${incidentName} including strategic goals, tactical priorities, safety objectives, resource allocation targets, and completion criteria for response operations in ${regionCoverage}.`,
        dataTypes: ['Strategic Objectives', 'Tactical Priorities', 'Safety Goals', 'Resource Targets', 'Success Metrics', 'Progress Status'],
        coverage: `${incidentName} - All Operations`,
        reliability: '99.9% uptime',
        dataSources: 'ICS-202 Forms, Planning Meeting Minutes, Tactics Meeting Notes, IAP Documentation, UC Meeting Records'
      }
    ];
  };

  const [dataSources, setDataSources] = useState<DataSourceItem[]>(
    data.dataSources || generateDataForSelection('gulf-coast', 'oil-spill-alpha')
  );

  // Function to manually update data
  const handleUpdate = () => {
    const newData = generateDataForSelection(selectedRegion, selectedIncident);
    setDataSources(newData);
    persist(newData);
  };


  const [formData, setFormData] = useState<DataSourceItem>({
    id: '',
    name: '',
    status: 'Active',
    lastUpdated: '',
    updateFrequency: '',
    provider: '',
    description: '',
    dataTypes: [],
    coverage: '',
    reliability: ''
  });

  const persist = (items: DataSourceItem[]) => {
    setDataSources(items);
    onDataChange({ ...data, dataSources: items });
  };

  const toggleSource = (id: string) => {
    setExpandedSources(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const openAddSource = () => {
    setEditingSourceId(null);
    setFormData({
      id: '',
      name: '',
      status: 'Active',
      lastUpdated: new Date().toLocaleString('en-US', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      }).replace(',', ''),
      updateFrequency: '',
      provider: '',
      description: '',
      dataTypes: [],
      coverage: '',
      reliability: ''
    });
    setIsSheetOpen(true);
  };

  const openEditSource = (id: string) => {
    const s = dataSources.find(x => x.id === id);
    if (!s) return;
    setEditingSourceId(id);
    setFormData({ ...s });
    setIsSheetOpen(true);
  };

  const deleteSource = (id: string) => {
    persist(dataSources.filter(s => s.id !== id));
  };

  const saveSource = () => {
    if (!formData.name || !formData.provider) {
      return;
    }
    if (editingSourceId) {
      persist(dataSources.map(s => (s.id === editingSourceId ? { ...formData, id: editingSourceId } : s)));
    } else {
      const id = `${Date.now()}`;
      persist([...dataSources, { ...formData, id }]);
    }
    setIsSheetOpen(false);
    setEditingSourceId(null);
  };

  const filtered = dataSources.filter(s => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      s.name.toLowerCase().includes(search) ||
      s.provider.toLowerCase().includes(search) ||
      s.status.toLowerCase().includes(search) ||
      s.dataTypes.some(dt => dt.toLowerCase().includes(search))
    );
  });

  const getStatusColor = (status: DataSourceStatus) => {
    switch (status) {
      case 'Active': return '#22c55e';
      case 'Delayed': return '#F59E0B';
      case 'Offline': return '#EF4444';
      case 'Maintenance': return '#6e757c';
      default: return '#6e757c';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#222529] rounded-lg border border-[#6e757c] relative">
        <div className="flex items-center justify-between px-[13px] py-3 w-full border-b-2 border-border rounded-t-lg rounded-b-none">
          <div className="flex items-center gap-4">
            <p className="caption text-nowrap text-white whitespace-pre">Report Sections</p>
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
        </div>
      </div>

      {/* Filter Mode Toggle and Dropdown */}
      <div className="space-y-3 px-4 py-3 bg-[#222529] rounded-lg border border-[#6e757c]">
        {/* Toggle Control with Update Button */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="caption text-white whitespace-nowrap">Filter by:</span>
            <div className="flex items-center bg-[#14171a] rounded-[4px] border border-[#6e757c] overflow-hidden">
              <button
                onClick={() => setFilterMode('region')}
                className={`caption px-3 py-1 transition-colors ${
                  filterMode === 'region'
                    ? 'bg-accent text-accent-foreground'
                    : 'text-white hover:bg-[#222529]'
                }`}
                style={{ 
                  fontFamily: "'Open Sans', sans-serif",
                  fontSize: '12px',
                  fontWeight: 400,
                  lineHeight: '18px'
                }}
              >
                Region
              </button>
              <button
                onClick={() => setFilterMode('incident')}
                className={`caption px-3 py-1 transition-colors ${
                  filterMode === 'incident'
                    ? 'bg-accent text-accent-foreground'
                    : 'text-white hover:bg-[#222529]'
                }`}
                style={{ 
                  fontFamily: "'Open Sans', sans-serif",
                  fontSize: '12px',
                  fontWeight: 400,
                  lineHeight: '18px'
                }}
              >
                Incident
              </button>
            </div>
          </div>
          <button
            onClick={handleUpdate}
            className="bg-[#01669f] h-[24px] rounded-[4px] px-4 hover:bg-[#01669f]/90 transition-colors flex items-center justify-center caption text-white"
            style={{ 
              fontFamily: "'Open Sans', sans-serif",
              fontSize: '12px',
              fontWeight: 400,
              lineHeight: '18px'
            }}
          >
            Update
          </button>
        </div>

        {/* Conditional Dropdown */}
        <div className="flex items-center gap-2">
          <span className="caption text-white whitespace-nowrap">
            {filterMode === 'region' ? 'Region:' : 'Incident:'}
          </span>
          {filterMode === 'region' ? (
            <Popover open={regionPopoverOpen} onOpenChange={setRegionPopoverOpen}>
              <PopoverTrigger asChild>
                <button
                  className="flex-1 h-[24px] bg-transparent border border-[#6e757c] rounded-[4px] px-2 caption text-white focus:outline-none focus:border-accent cursor-pointer flex items-center justify-between"
                  style={{ 
                    fontFamily: "'Open Sans', sans-serif",
                    fontSize: '12px',
                    fontWeight: 400,
                    lineHeight: '18px'
                  }}
                >
                  {regions.find(r => r.id === selectedRegion)?.name || 'Select region...'}
                  <ChevronDown className="h-3 w-3 shrink-0 opacity-50" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0 bg-[#222529] border-[#6e757c]" align="start">
                <Command className="bg-[#222529]">
                  <CommandInput 
                    placeholder="Search region..." 
                    className="h-9 caption text-white"
                    style={{ 
                      fontFamily: "'Open Sans', sans-serif",
                      fontSize: '12px',
                      fontWeight: 400,
                      lineHeight: '18px'
                    }}
                  />
                  <CommandList>
                    <CommandEmpty className="caption text-white/70 p-2">No region found.</CommandEmpty>
                    <CommandGroup>
                      {regions.map((region) => (
                        <CommandItem
                          key={region.id}
                          value={region.name}
                          onSelect={() => {
                            setSelectedRegion(region.id);
                            setRegionPopoverOpen(false);
                          }}
                          className="caption text-white cursor-pointer hover:bg-[#14171a] data-[selected=true]:bg-[#14171a]"
                          style={{ 
                            fontFamily: "'Open Sans', sans-serif",
                            fontSize: '12px',
                            fontWeight: 400,
                            lineHeight: '18px'
                          }}
                        >
                          <Check
                            className={`mr-2 h-3 w-3 ${
                              selectedRegion === region.id ? 'opacity-100' : 'opacity-0'
                            }`}
                          />
                          {region.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          ) : (
            <Popover open={incidentPopoverOpen} onOpenChange={setIncidentPopoverOpen}>
              <PopoverTrigger asChild>
                <button
                  className="flex-1 h-[24px] bg-transparent border border-[#6e757c] rounded-[4px] px-2 caption text-white focus:outline-none focus:border-accent cursor-pointer flex items-center justify-between"
                  style={{ 
                    fontFamily: "'Open Sans', sans-serif",
                    fontSize: '12px',
                    fontWeight: 400,
                    lineHeight: '18px'
                  }}
                >
                  {incidents.find(i => i.id === selectedIncident)?.name || 'Select incident...'}
                  <ChevronDown className="h-3 w-3 shrink-0 opacity-50" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0 bg-[#222529] border-[#6e757c]" align="start">
                <Command className="bg-[#222529]">
                  <CommandInput 
                    placeholder="Search incident..." 
                    className="h-9 caption text-white"
                    style={{ 
                      fontFamily: "'Open Sans', sans-serif",
                      fontSize: '12px',
                      fontWeight: 400,
                      lineHeight: '18px'
                    }}
                  />
                  <CommandList>
                    <CommandEmpty className="caption text-white/70 p-2">No incident found.</CommandEmpty>
                    <CommandGroup>
                      {incidents.map((incident) => (
                        <CommandItem
                          key={incident.id}
                          value={incident.name}
                          onSelect={() => {
                            setSelectedIncident(incident.id);
                            setIncidentPopoverOpen(false);
                          }}
                          className="caption text-white cursor-pointer hover:bg-[#14171a] data-[selected=true]:bg-[#14171a]"
                          style={{ 
                            fontFamily: "'Open Sans', sans-serif",
                            fontSize: '12px',
                            fontWeight: 400,
                            lineHeight: '18px'
                          }}
                        >
                          <Check
                            className={`mr-2 h-3 w-3 ${
                              selectedIncident === incident.id ? 'opacity-100' : 'opacity-0'
                            }`}
                          />
                          {incident.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>

      {/* Data Sources List */}
      <div className="space-y-4">
        {filtered.map((source) => {
          const isExpanded = expandedSources.has(source.id);
          return (
            <div
              key={source.id}
              className="border border-border rounded-lg overflow-hidden"
              style={{ background: 'linear-gradient(90deg, rgba(2, 163, 254, 0.08) 0%, rgba(0, 0, 0, 0) 100%), linear-gradient(90deg, rgb(20, 23, 26) 0%, rgb(20, 23, 26) 100%)' }}
            >
              <div className={`p-3 ${isExpanded ? 'border-b border-border' : ''}`}>
                <div className="flex items-start justify-between">
                  <div
                    className="flex items-start gap-2 flex-1 cursor-pointer"
                    onClick={() => {
                      toggleSource(source.id);
                      if (onAddAIContext) {
                        onAddAIContext(source.name);
                      }
                    }}
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <span className="caption text-white">{source.name}</span>
                      {!isExpanded && (
                        <div className="flex items-center gap-3 mt-1">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getStatusColor(source.status) }} />
                            <span className="caption" style={{ color: getStatusColor(source.status) }}>{source.status}</span>
                          </div>
                          <span className="caption text-white/70">Last updated: {source.lastUpdated}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Simulate refresh
                        const updatedSources = dataSources.map(s => 
                          s.id === source.id 
                            ? { ...s, lastUpdated: new Date().toLocaleString('en-US', { 
                                year: 'numeric', 
                                month: '2-digit', 
                                day: '2-digit', 
                                hour: '2-digit', 
                                minute: '2-digit',
                                hour12: false 
                              }).replace(',', '') }
                            : s
                        );
                        persist(updatedSources);
                      }}
                      className="p-1 hover:bg-muted/30 rounded transition-colors"
                      title="Refresh data source"
                    >
                      <RefreshCw className="w-3 h-3 text-white" />
                    </button>
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="p-4 space-y-4 bg-card/50">
                  {source.description && (
                    <div>
                      <label className="text-white mb-1 block">Description</label>
                      <p className="caption text-white">{source.description}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-white mb-1 block">Last Updated</label>
                    <p className="caption text-white">{source.lastUpdated}</p>
                  </div>
                  {source.dataSources && (
                    <div>
                      <label className="text-white mb-1 block">Data Sources</label>
                      <p className="caption text-white">{source.dataSources}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-white mb-1 block">Placeholder Field for Data</label>
                    <p className="caption text-white">Placeholder content</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add/Edit Data Source Side Panel */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-[640px] bg-card overflow-y-auto px-6">
          <SheetHeader>
            <SheetTitle>{editingSourceId ? 'Edit Data Source' : 'Add Data Source'}</SheetTitle>
            <SheetDescription>
              {editingSourceId ? 'Update data source details.' : 'Add a new data source to track.'}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6 pb-6">
            <div className="space-y-2">
              <Label className="text-foreground">Name <span className="text-destructive">*</span></Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="bg-input-background border-border" />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Provider <span className="text-destructive">*</span></Label>
              <Input value={formData.provider} onChange={(e) => setFormData({ ...formData, provider: e.target.value })} className="bg-input-background border-border" />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Update Frequency</Label>
              <Input value={formData.updateFrequency} onChange={(e) => setFormData({ ...formData, updateFrequency: e.target.value })} className="bg-input-background border-border" placeholder="e.g., Every 5 minutes" />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Coverage</Label>
              <Input value={formData.coverage} onChange={(e) => setFormData({ ...formData, coverage: e.target.value })} className="bg-input-background border-border" />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Reliability</Label>
              <Input value={formData.reliability} onChange={(e) => setFormData({ ...formData, reliability: e.target.value })} className="bg-input-background border-border" placeholder="e.g., 99.9% uptime" />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Description</Label>
              <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="bg-input-background border-border min-h-[120px] resize-none" />
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={saveSource} className="flex-1 bg-primary hover:bg-primary/90">{editingSourceId ? 'Update Source' : 'Add Source'}</Button>
              <Button onClick={() => setIsSheetOpen(false)} variant="outline" className="flex-1 border-border">Cancel</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
