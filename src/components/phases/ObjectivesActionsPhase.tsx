import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command';
import { Checkbox } from '../ui/checkbox';
import { Edit2, Trash2, ChevronRight, ChevronDown, Map, Check, X, Filter } from 'lucide-react';
import svgPaths from '../../imports/svg-7hg6d30srz';

interface Action {
  id: string;
  description: string;
  status: string;
  assignee?: string;
  time?: string;
  date?: string;
  timezone?: string;
}

interface Objective {
  id: string;
  title: string;
  type: 'Operational' | 'Managerial';
  actions: Action[];
  childIncidents?: Objective[];
}

interface ObjectivesActionsPhaseProps {
  data?: Record<string, any>;
  onDataChange: (data: Record<string, any>) => void;
  onComplete: () => void;
  onPrevious?: () => void;
  onRecommendActions?: () => void;
  onZoomToLocation?: (center: string, scale: string) => void;
  onAddAIContext?: (itemName: string) => void;
  onApplyDataLayerFilter?: (incident: string) => void;
}

export function ObjectivesActionsPhase({ data = {}, onDataChange, onComplete, onPrevious, onRecommendActions, onZoomToLocation, onAddAIContext, onApplyDataLayerFilter }: ObjectivesActionsPhaseProps) {
  // Helper functions for severity (defined before state to use in initial sort)
  const getIncidentSeverityHelper = (id: string): 'Minor' | 'Moderate' | 'Serious' | 'Severe' | 'Critical' => {
    switch (id) {
      case '1': return 'Serious';
      case '1a': return 'Moderate';
      case '1b': return 'Serious';
      case '2': return 'Moderate';
      case '3': return 'Moderate';
      case '3a': return 'Moderate';
      case '3b': return 'Minor';
      case '4': return 'Minor';
      case '5': return 'Severe';
      case '6': return 'Serious';
      default: return 'Moderate';
    }
  };

  const getSeverityRankHelper = (severity: string): number => {
    switch (severity) {
      case 'Critical': return 5;
      case 'Severe': return 4;
      case 'Serious': return 3;
      case 'Moderate': return 2;
      case 'Minor': return 1;
      default: return 0;
    }
  };

  const initialObjectives = data.objectives || [
    {
      id: '1',
      title: 'Gulf Coast Pipeline Spill — Plaquemines Parish, LA',
      type: 'Operational',
      actions: [],
      childIncidents: [
        {
          id: '1a',
          title: 'Bayou Dularge Contamination — Secondary Impact Zone',
          type: 'Operational',
          actions: []
        },
        {
          id: '1b',
          title: 'Estuarine Wildlife Area Response — Barataria Bay',
          type: 'Operational',
          actions: []
        }
      ]
    },
    {
      id: '2',
      title: 'Santa Barbara Offshore Platform Leak — Santa Barbara, CA',
      type: 'Operational',
      actions: []
    },
    {
      id: '3',
      title: 'Delaware River Tanker Spill — Philadelphia, PA',
      type: 'Operational',
      actions: [],
      childIncidents: [
        {
          id: '3a',
          title: 'Port of Philadelphia Terminal Contamination',
          type: 'Operational',
          actions: []
        },
        {
          id: '3b',
          title: 'Delaware Estuary Shoreline Protection',
          type: 'Operational',
          actions: []
        }
      ]
    },
    {
      id: '4',
      title: 'Straits of Mackinac Sheen — Mackinaw City, MI',
      type: 'Operational',
      actions: []
    },
    {
      id: '5',
      title: 'Galveston Bay Barge Collision — Galveston, TX',
      type: 'Operational',
      actions: []
    },
    {
      id: '6',
      title: 'Mobile Bay Pipeline Release — Mobile, AL',
      type: 'Operational',
      actions: []
    }
  ];

  // Sort by severity (Severe at top, then Serious, etc.)
  const sortedObjectives = initialObjectives.sort((a, b) => {
    const severityA = getIncidentSeverityHelper(a.id);
    const severityB = getIncidentSeverityHelper(b.id);
    return getSeverityRankHelper(severityB) - getSeverityRankHelper(severityA);
  });

  const [objectives, setObjectives] = useState<Objective[]>(sortedObjectives);

  const [editingObjective, setEditingObjective] = useState<string | null>(null);
  const [editingObjectiveOriginal, setEditingObjectiveOriginal] = useState<Objective | null>(null);
  const [editingAction, setEditingAction] = useState<{ objectiveId: string; actionId: string } | null>(null);
  const [editingActionOriginal, setEditingActionOriginal] = useState<Action | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedObjectives, setExpandedObjectives] = useState<Set<string>>(new Set());
  const [expandedChildIncidents, setExpandedChildIncidents] = useState<Set<string>>(new Set());
  const [isAddIncidentModalOpen, setIsAddIncidentModalOpen] = useState(false);
  const [selectedIncidentTypes, setSelectedIncidentTypes] = useState<string[]>([]);
  const [isIncidentTypePopoverOpen, setIsIncidentTypePopoverOpen] = useState(false);
  
  type IncidentDetails = {
    description: string;
    location: string;
    status: 'Active' | 'Contained' | 'Monitoring';
    startTime: string;
    estimatedVolume: string;
    shorelineImpact: string;
    responsibleParty: string;
    incidentCommander: string;
    lastUpdate: string;
  };

  // Available incident types
  const incidentTypes = [
    'Pipeline Spill',
    'Platform Leak',
    'Tanker Spill',
    'Barge Collision',
    'Sheen/Surface Oil',
    'Pipeline Release',
    'Vessel Incident',
    'Other'
  ];

  // Get incident type based on objective title
  const getIncidentType = (objective: Objective): string => {
    const title = objective.title.toLowerCase();
    if (title.includes('pipeline spill') || title.includes('pipeline release')) {
      return title.includes('release') ? 'Pipeline Release' : 'Pipeline Spill';
    }
    if (title.includes('platform') && title.includes('leak')) return 'Platform Leak';
    if (title.includes('tanker') && title.includes('spill')) return 'Tanker Spill';
    if (title.includes('barge') && title.includes('collision')) return 'Barge Collision';
    if (title.includes('sheen')) return 'Sheen/Surface Oil';
    if (title.includes('vessel')) return 'Vessel Incident';
    return 'Other';
  };

  // Get severity level for each incident
  const getIncidentSeverity = (id: string): 'Minor' | 'Moderate' | 'Serious' | 'Severe' | 'Critical' => {
    switch (id) {
      case '1': return 'Serious'; // Gulf Coast Pipeline Spill
      case '1a': return 'Moderate'; // Bayou Dularge Contamination (child)
      case '1b': return 'Serious'; // Estuarine Wildlife Area Response (child)
      case '2': return 'Moderate'; // Santa Barbara Offshore Platform Leak
      case '3': return 'Moderate'; // Delaware River Tanker Spill
      case '3a': return 'Moderate'; // Port Terminal Contamination (child)
      case '3b': return 'Minor'; // Delaware Estuary Protection (child, preventive)
      case '4': return 'Minor'; // Straits of Mackinac Sheen
      case '5': return 'Severe'; // Galveston Bay Barge Collision
      case '6': return 'Serious'; // Mobile Bay Pipeline Release
      default: return 'Moderate';
    }
  };

  // Get severity rank (higher number = more severe)
  const getSeverityRank = (severity: string): number => {
    switch (severity) {
      case 'Critical': return 5;
      case 'Severe': return 4;
      case 'Serious': return 3;
      case 'Moderate': return 2;
      case 'Minor': return 1;
      default: return 0;
    }
  };

  // Get color for severity level
  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'Critical': return '#DC2626'; // Red-600
      case 'Severe': return '#EA580C'; // Orange-600
      case 'Serious': return '#F59E0B'; // Amber-500
      case 'Moderate': return '#EAB308'; // Yellow-500
      case 'Minor': return '#84CC16'; // Lime-500
      default: return '#6B7280'; // Gray-500
    }
  };

  // Get map coordinates for each incident location
  const getIncidentCoordinates = (id: string): { center: string; scale: string } => {
    switch (id) {
      case '1': // Plaquemines Parish, LA
        return { center: '-89.6843,29.3547', scale: '144447.638572' };
      case '1a': // Bayou Dularge, LA (child incident)
        return { center: '-90.2351,29.3782', scale: '72223.819286' };
      case '1b': // Barataria Bay, LA (child incident)
        return { center: '-90.1289,29.4516', scale: '72223.819286' };
      case '2': // Santa Barbara Channel, CA
        return { center: '-119.6982,34.3933', scale: '144447.638572' };
      case '3': // Philadelphia, PA
        return { center: '-75.1652,39.9526', scale: '72223.819286' };
      case '3a': // Port of Philadelphia Terminal 5 (child incident)
        return { center: '-75.1448,39.9022', scale: '36111.909643' };
      case '3b': // Delaware Estuary (child incident)
        return { center: '-75.3894,39.7391', scale: '144447.638572' };
      case '4': // Mackinaw City, MI
        return { center: '-84.7272,45.7772', scale: '144447.638572' };
      case '5': // Galveston, TX
        return { center: '-94.7977,29.3013', scale: '144447.638572' };
      case '6': // Mobile, AL
        return { center: '-88.0399,30.6954', scale: '144447.638572' };
      default:
        return { center: '-74.006,40.7128', scale: '72223.819286' }; // Default to NYC
    }
  };

  // Get data layer incident filter value for each incident
  const getIncidentFilterValue = (id: string): string => {
    // Map incident IDs to their incident filter values
    switch (id) {
      case '1':
        return 'gulf-coast-pipeline';
      case '1a':
        return 'bayou-dularge';
      case '1b':
        return 'estuarine-wildlife';
      case '3':
        return 'delaware-river-tanker';
      case '3a':
        return 'port-terminal';
      case '3b':
        return 'delaware-estuary';
      default:
        return 'gulf-coast-pipeline';
    }
  };

  const getIncidentDetails = (id: string): IncidentDetails => {
    switch (id) {
      case '1':
        return {
          description: 'Subsurface pipeline release impacting marshlands and adjacent waterways; containment booms deployed along bayou inlets.',
          location: 'Plaquemines Parish, LA',
          status: 'Active',
          startTime: 'Today 06:40',
          estimatedVolume: '~2,500 bbl (TBD)',
          shorelineImpact: 'Low‑moderate marsh sheen; sensitive habitat protection in progress',
          responsibleParty: 'Gulf Midstream Partners',
          incidentCommander: 'USCG Sector NOLA (Unified)',
          lastUpdate: 'Boom expansion and skimmer staging underway'
        };
      case '2':
        return {
          description: 'Platform equipment failure with intermittent discharge; offshore sheen moving southwest with current.',
          location: 'Santa Barbara Channel, CA',
          status: 'Active',
          startTime: 'Yesterday 22:15',
          estimatedVolume: '~800 bbl (prelim.)',
          shorelineImpact: 'Minimal; shoreline assessment teams deployed',
          responsibleParty: 'Pacific Offshore Energy',
          incidentCommander: 'USCG/MSRC (Unified)',
          lastUpdate: 'Repair crew on platform; overflight scheduled 16:00'
        };
      case '3':
        return {
          description: 'Tanker manifold leak alongside berth; harbor booming complete with vacuum trucks on scene.',
          location: 'Philadelphia, PA',
          status: 'Active',
          startTime: 'Today 05:20',
          estimatedVolume: '~350 bbl',
          shorelineImpact: 'Contained within berth; no river shoreline impacts observed',
          responsibleParty: 'RiverFuel Logistics',
          incidentCommander: 'USCG Sector Delaware Bay',
          lastUpdate: 'Product transfer halted; repair plan under review'
        };
      case '4':
        return {
          description: 'Reported surface sheen near Straits; source under investigation; precautionary booming at key inlets.',
          location: 'Mackinaw City, MI',
          status: 'Monitoring',
          startTime: 'Today 07:10',
          estimatedVolume: 'TBD (trace sheen)',
          shorelineImpact: 'None confirmed; environmental monitoring ongoing',
          responsibleParty: 'Unknown — under investigation',
          incidentCommander: 'State/USCG (Unified)',
          lastUpdate: 'Sampling initiated; overwater drone survey requested'
        };
      case '5':
        return {
          description: 'Barge collision released product in channel; current and tide driving sheen toward outer bay.',
          location: 'Galveston, TX',
          status: 'Active',
          startTime: 'Today 03:55',
          estimatedVolume: '~1,200 bbl (est.)',
          shorelineImpact: 'Potential for marsh impact with outgoing tide',
          responsibleParty: 'Coastal Marine Transport',
          incidentCommander: 'USCG Sector Houston‑Galveston',
          lastUpdate: 'Secondary booming and skimmer ops scaling up'
        };
      case '6':
        return {
          description: 'Pipeline release near wetlands fringe; access constraints impacting heavy equipment placement.',
          location: 'Mobile, AL',
          status: 'Active',
          startTime: 'Today 04:30',
          estimatedVolume: '~600 bbl (prelim.)',
          shorelineImpact: 'Localized wetland impact; wildlife teams engaged',
          responsibleParty: 'Bay Shore Pipelines',
          incidentCommander: 'USCG Sector Mobile (Unified)',
          lastUpdate: 'Access matting and vacuum support in progress'
        };
      case '1a':
        return {
          description: 'Secondary contamination zone downstream from primary spill site; product migration detected in shallow bayou channels requiring additional containment measures.',
          location: 'Bayou Dularge, Plaquemines Parish, LA',
          status: 'Active',
          startTime: 'Today 09:15',
          estimatedVolume: '~400 bbl (migrated)',
          shorelineImpact: 'Moderate; active protection of sensitive marsh areas',
          responsibleParty: 'Gulf Midstream Partners (parent incident)',
          incidentCommander: 'USCG Sector NOLA - Marine Branch',
          lastUpdate: 'Additional boom deployment and skimming operations initiated'
        };
      case '1b':
        return {
          description: 'Oil sheen detected in estuarine wildlife refuge requiring specialized response protocols; nesting bird colonies at risk during active breeding season.',
          location: 'Barataria Bay Wildlife Management Area, LA',
          status: 'Active',
          startTime: 'Today 11:30',
          estimatedVolume: '~150 bbl (surface sheen)',
          shorelineImpact: 'High sensitivity; wildlife hazing and nest protection underway',
          responsibleParty: 'Gulf Midstream Partners (parent incident)',
          incidentCommander: 'USCG/USFWS (Unified)',
          lastUpdate: 'Wildlife specialists deployed; absorbent boom placement in progress'
        };
      case '3a':
        return {
          description: 'Product accumulation at terminal berth area; contaminated ballast water containment and recovery operations ongoing with specialized vacuum equipment.',
          location: 'Port of Philadelphia Terminal 5, Philadelphia, PA',
          status: 'Active',
          startTime: 'Today 07:45',
          estimatedVolume: '~200 bbl (berth area)',
          shorelineImpact: 'Contained within terminal; no open water release',
          responsibleParty: 'RiverFuel Logistics (parent incident)',
          incidentCommander: 'USCG Sector Delaware Bay - Waterways',
          lastUpdate: 'Terminal operations suspended; recovery operations at 60% completion'
        };
      case '3b':
        return {
          description: 'Precautionary shoreline protection measures deployed along Delaware Estuary sensitive areas; monitoring stations established at critical wildlife habitats and water intakes.',
          location: 'Delaware Estuary, Philadelphia to Wilmington, DE',
          status: 'Monitoring',
          startTime: 'Today 08:20',
          estimatedVolume: 'Preventive (no confirmed release)',
          shorelineImpact: 'Preventive measures; no current impact',
          responsibleParty: 'RiverFuel Logistics (parent incident)',
          incidentCommander: 'USCG Sector Delaware Bay - Prevention',
          lastUpdate: 'Protective booming at water intakes; ongoing surveillance flights'
        };
      default:
        return {
          description: 'Pipeline release near wetlands fringe; access constraints impacting heavy equipment placement.',
          location: 'Mobile, AL',
          status: 'Active',
          startTime: 'Today 04:30',
          estimatedVolume: '~600 bbl (prelim.)',
          shorelineImpact: 'Localized wetland impact; wildlife teams engaged',
          responsibleParty: 'Bay Shore Pipelines',
          incidentCommander: 'USCG Sector Mobile (Unified)',
          lastUpdate: 'Access matting and vacuum support in progress'
        };
    }
  };

  // Helper functions for action items
  type ActionItem = {
    title: string;
    assignedTo: string;
    priority: 'High' | 'Medium' | 'Low';
    status: 'Completed' | 'In Progress' | 'Pending' | 'Overdue';
    dueDate: string;
    location: string;
    description: string;
    taskId: string;
    startedAt?: string;
    completedAt?: string;
  };

  const getActionsForIncident = (incidentId: string): ActionItem[] => {
    switch (incidentId) {
      case '1': // Gulf Coast Pipeline Spill
        return [
          {
            title: 'Deploy additional boom at Bayou Dularge',
            assignedTo: 'Operations - Marine Branch',
            priority: 'High',
            status: 'In Progress',
            dueDate: '11/16/2025 18:00',
            location: 'Bayou Dularge, Plaquemines Parish',
            description: 'Deploy 1,500 ft of additional containment boom along Bayou Dularge to reinforce existing protection measures. Coordinate with Marine Branch Division Alpha for vessel support.',
            taskId: 'ICS-204-A-015',
            startedAt: '11/15/2025 14:30'
          },
          {
            title: 'Conduct wildlife survey in Barataria Bay',
            assignedTo: 'Environmental Unit',
            priority: 'High',
            status: 'Pending',
            dueDate: '11/16/2025 08:00',
            location: 'Barataria Bay Wetlands',
            description: 'Complete systematic wildlife survey of Barataria Bay critical habitat areas. Document any oiled wildlife observations and report to Wildlife Branch immediately.',
            taskId: 'ICS-215-E-022'
          },
          {
            title: 'Mobilize Skimmer Vessel Bravo-2',
            assignedTo: 'Logistics Section',
            priority: 'Medium',
            status: 'In Progress',
            dueDate: '11/15/2025 22:00',
            location: 'Venice Launch Complex',
            description: 'Transport and prepare Skimmer Vessel Bravo-2 for operational deployment. Ensure full fuel capacity and verify all recovery equipment is operational.',
            taskId: 'ICS-204-L-008',
            startedAt: '11/15/2025 16:00'
          }
        ];
      case '2': // Santa Barbara Offshore Platform Leak
        return [
          {
            title: 'Deploy repair crew to offshore platform',
            assignedTo: 'Operations - Offshore Team',
            priority: 'High',
            status: 'In Progress',
            dueDate: '11/16/2025 12:00',
            location: 'Platform Beta-7, Santa Barbara Channel',
            description: 'Transport specialized repair team to offshore platform to address equipment failure. Ensure all safety protocols and weather clearances are in place.',
            taskId: 'ICS-204-O-031',
            startedAt: '11/15/2025 10:00'
          },
          {
            title: 'Conduct aerial overflight survey',
            assignedTo: 'Environmental Unit - SCAT',
            priority: 'High',
            status: 'Pending',
            dueDate: '11/15/2025 16:00',
            location: 'Santa Barbara Channel',
            description: 'Execute aerial survey to track sheen movement and assess potential shoreline impact. Document extent and trajectory for response planning.',
            taskId: 'ICS-215-E-018'
          },
          {
            title: 'Activate shoreline assessment teams',
            assignedTo: 'Operations - SCAT Team 1',
            priority: 'Medium',
            status: 'Completed',
            dueDate: '11/15/2025 14:00',
            location: 'Santa Barbara Coastline',
            description: 'Deploy SCAT teams to monitor potential shoreline oiling. Establish survey zones and reporting protocols.',
            taskId: 'ICS-204-S-012',
            startedAt: '11/15/2025 08:00',
            completedAt: '11/15/2025 13:45'
          }
        ];
      case '3': // Delaware River Tanker Spill
        return [
          {
            title: 'Complete harbor containment booming',
            assignedTo: 'Operations - Marine Branch',
            priority: 'High',
            status: 'Completed',
            dueDate: '11/15/2025 08:00',
            location: 'Philadelphia Berth 4',
            description: 'Deploy containment boom around affected berth area to prevent product spread into Delaware River. Maintain boom integrity.',
            taskId: 'ICS-204-M-005',
            startedAt: '11/15/2025 05:30',
            completedAt: '11/15/2025 07:50'
          },
          {
            title: 'Deploy vacuum trucks for recovery',
            assignedTo: 'Operations - Recovery Team',
            priority: 'High',
            status: 'In Progress',
            dueDate: '11/15/2025 18:00',
            location: 'Philadelphia Berth 4',
            description: 'Position vacuum recovery trucks and initiate product recovery operations within contained area. Monitor recovery progress hourly.',
            taskId: 'ICS-204-R-011',
            startedAt: '11/15/2025 09:00'
          },
          {
            title: 'Develop tanker repair plan',
            assignedTo: 'Planning Section - Technical Specialist',
            priority: 'Medium',
            status: 'Pending',
            dueDate: '11/15/2025 20:00',
            location: 'Unified Command Post',
            description: 'Work with responsible party to develop repair plan for tanker manifold. Review for safety and environmental compliance.',
            taskId: 'ICS-215-P-007'
          }
        ];
      case '4': // Straits of Mackinac Sheen
        return [
          {
            title: 'Conduct source investigation',
            assignedTo: 'Environmental Unit - Investigation Team',
            priority: 'High',
            status: 'In Progress',
            dueDate: '11/15/2025 16:00',
            location: 'Straits of Mackinac',
            description: 'Investigate reported sheen source through water sampling and visual surveys. Coordinate with USCG and State environmental agencies.',
            taskId: 'ICS-215-E-024',
            startedAt: '11/15/2025 08:00'
          },
          {
            title: 'Deploy precautionary boom at key inlets',
            assignedTo: 'Operations - Marine Branch',
            priority: 'Medium',
            status: 'In Progress',
            dueDate: '11/15/2025 15:00',
            location: 'Mackinaw City Inlets',
            description: 'As precautionary measure, deploy boom at sensitive inlet locations to protect against potential shoreline contact.',
            taskId: 'ICS-204-M-019',
            startedAt: '11/15/2025 10:30'
          },
          {
            title: 'Execute drone survey of affected area',
            assignedTo: 'Operations - UAS Team',
            priority: 'High',
            status: 'Pending',
            dueDate: '11/15/2025 14:00',
            location: 'Straits of Mackinac',
            description: 'Deploy unmanned aerial system to survey water surface and document sheen extent. Provide imagery for analysis.',
            taskId: 'ICS-204-U-003'
          }
        ];
      case '5': // Galveston Bay Barge Collision
        return [
          {
            title: 'Scale up skimmer operations',
            assignedTo: 'Operations - Marine Branch',
            priority: 'High',
            status: 'In Progress',
            dueDate: '11/15/2025 20:00',
            location: 'Galveston Bay Channel',
            description: 'Mobilize additional skimmer vessels to intercept product before it reaches marsh areas. Coordinate with tug support.',
            taskId: 'ICS-204-M-027',
            startedAt: '11/15/2025 06:00'
          },
          {
            title: 'Deploy secondary boom line',
            assignedTo: 'Operations - Boom Team',
            priority: 'High',
            status: 'In Progress',
            dueDate: '11/15/2025 18:00',
            location: 'Outer Galveston Bay',
            description: 'Establish secondary containment boom line to protect marsh habitats from incoming tide. Monitor tidal predictions.',
            taskId: 'ICS-204-B-014',
            startedAt: '11/15/2025 08:30'
          },
          {
            title: 'Activate marsh protection teams',
            assignedTo: 'Environmental Unit',
            priority: 'High',
            status: 'Pending',
            dueDate: '11/15/2025 16:00',
            location: 'Galveston Bay Marshlands',
            description: 'Pre-position marsh protection equipment and teams at high-risk areas identified in Geographic Response Strategies.',
            taskId: 'ICS-215-E-016'
          }
        ];
      case '6': // Mobile Bay Pipeline Release
        return [
          {
            title: 'Install access matting for equipment',
            assignedTo: 'Logistics - Ground Support Unit',
            priority: 'High',
            status: 'In Progress',
            dueDate: '11/15/2025 17:00',
            location: 'Mobile Bay Wetlands Access Point',
            description: 'Deploy temporary access matting to enable heavy equipment access while minimizing wetland disturbance. Coordinate with Environmental Unit.',
            taskId: 'ICS-204-G-022',
            startedAt: '11/15/2025 09:00'
          },
          {
            title: 'Deploy vacuum truck support',
            assignedTo: 'Operations - Recovery Team',
            priority: 'High',
            status: 'Pending',
            dueDate: '11/15/2025 19:00',
            location: 'Pipeline Release Site, Mobile Bay',
            description: 'Position vacuum trucks at release site once access is established. Initiate product recovery operations.',
            taskId: 'ICS-204-R-018'
          },
          {
            title: 'Conduct wildlife impact assessment',
            assignedTo: 'Environmental Unit - Wildlife Branch',
            priority: 'Medium',
            status: 'In Progress',
            dueDate: '11/16/2025 10:00',
            location: 'Mobile Bay Wetlands',
            description: 'Survey wetland areas for wildlife impacts and oiling. Coordinate wildlife rehabilitation if needed.',
            taskId: 'ICS-215-W-009',
            startedAt: '11/15/2025 11:00'
          }
        ];
      default:
        return [];
    }
  };

  const getPriorityColorForAction = (priority: string): string => {
    switch (priority) {
      case 'High': return '#EF4444';
      case 'Medium': return '#F59E0B';
      case 'Low': return '#22c55e';
      default: return '#6e757c';
    }
  };

  const getStatusColorForAction = (status: string): string => {
    switch (status) {
      case 'Completed': return '#22c55e';
      case 'In Progress': return '#3B82F6';
      case 'Pending': return '#facc15';
      case 'Overdue': return '#EF4444';
      default: return '#6e757c';
    }
  };
  const [showRecommended, setShowRecommended] = useState<Set<string>>(new Set());

  // Plausible IACI-centric assignees for an ongoing cyber attack
  const officialNames: string[] = [
    'IACI‑CERT Incident Lead',
    'IACInet Intelligence Lead',
    'Sector ISAC Analyst',
    'Member Organization SOC Lead',
    'CISA Central Liaison',
    'FBI Cyber Task Force Liaison',
    'SRMA Sector Liaison',
    'OT/ICS Security Lead',
    'Cloud Provider CSIRT',
    'Legal & Privacy Counsel',
    'Public Affairs (JIC)',
    'CISO, Member Organization'
  ];

  const getRecommendedActionsForObjective = (objectiveTitle: string): Action[] => {
    const title = objectiveTitle.toLowerCase();
    const makeId = (suffix: number) => `${Date.now()}-${suffix}`;

    // Life safety / rescue / sheltering
    if (
      title.includes('life') ||
      title.includes('rescue') ||
      title.includes('evacu') ||
      title.includes('shelter') ||
      title.includes('stabilize')
    ) {
      return [
        {
          id: makeId(1),
          description: 'Conduct high-water rescues and welfare checks in Cape Fear and Neuse basin communities; stage boats and HMMWVs at county EOCs (next 12–24 hrs).',
          status: 'Current',
        },
        {
          id: makeId(2),
          description: 'Sustain shelter operations for ~15,000 evacuees; ensure ADA access, medical triage, and behavioral health; coordinate supply chain (cots, blankets, meds).',
          status: 'Current',
        },
        {
          id: makeId(3),
          description: 'Execute targeted evacuations for neighborhoods with crest forecasts > major flood stage; issue IPAWS alerts and door-to-door notifications.',
          status: 'Current',
        },
        {
          id: makeId(4),
          description: 'Establish missing-persons tracking and reunification workflow with ARC and local PSAPs; update every 4 hours.',
          status: 'Planned (24h)',
        },
      ];
    }

    // Critical infrastructure / power / water / transportation
    if (
      title.includes('infrastructure') ||
      title.includes('power') ||
      title.includes('water') ||
      title.includes('transport') ||
      title.includes('corridor') ||
      title.includes('restore')
    ) {
      return [
        {
          id: makeId(1),
          description: 'Prioritize power restoration for hospitals, water/wastewater plants, and shelters; deploy generators and fuel support where grid access is delayed.',
          status: 'Current',
        },
        {
          id: makeId(2),
          description: 'Issue/maintain boil-water advisories; distribute bottled water; deploy mobile testing teams to impacted systems in six affected counties.',
          status: 'Current',
        },
        {
          id: makeId(3),
          description: 'Clear debris from priority routes; conduct bridge inspections; plan phased reopening of I‑95 and US‑70 when waters recede and safety checks pass.',
          status: 'Current',
        },
        {
          id: makeId(4),
          description: 'Stand up debris management sites and hazardous waste segregation in coordination with NCDEQ and county public works.',
          status: 'Planned (48–72h)',
        },
      ];
    }

    // Unified command / situational awareness / FEMA coordination
    if (
      title.includes('unified') ||
      title.includes('situational') ||
      title.includes('awareness') ||
      title.includes('fema') ||
      title.includes('command') ||
      title.includes('coordination')
    ) {
      return [
        {
          id: makeId(1),
          description: 'Activate Unified Command (NCEM, FEMA, NCNG, NCDOT, NCDEQ, utilities); set operational period schedule and SITREP cadence (AM/PM).',
          status: 'Current',
        },
        {
          id: makeId(2),
          description: 'Publish twice-daily river forecasts and flood-inundation maps; synchronize evacuation zones and public messaging with county PIOs.',
          status: 'Current',
        },
        {
          id: makeId(3),
          description: 'Establish regional logistics staging areas; track mission assignments (rescue, sheltering, debris) and resource requests in WebEOC.',
          status: 'Current',
        },
        {
          id: makeId(4),
          description: 'Coordinate federal assistance under DR‑4393‑NC; align state mission tasks with FEMA resource offerings (USAR, IA/PA, commodities).',
          status: 'Planned (24–48h)',
        },
      ];
    }

    // Fallback: generic flood-response actions
    return [
      { id: makeId(1), description: 'Validate life safety priorities; confirm rescue/sheltering posture and unmet needs with county EOCs.', status: 'Current' },
      { id: makeId(2), description: 'Update power/water restoration timelines; identify critical facilities needing generators or fuel resupply.', status: 'Current' },
      { id: makeId(3), description: 'Publish unified public messaging on travel restrictions, boil-water advisories, and assistance programs.', status: 'Planned (24h)' },
    ];
  };

  const updateData = (newObjectives: Objective[]) => {
    setObjectives(newObjectives);
    onDataChange({ ...data, objectives: newObjectives });
  };

  const addObjective = (position: 'top' | 'bottom' = 'bottom') => {
    const newObjective: Objective = {
      id: Date.now().toString(),
      title: '',
      type: 'Operational',
      actions: []
    };
    if (position === 'top') {
      updateData([newObjective, ...objectives]);
    } else {
      updateData([...objectives, newObjective]);
    }
    // Set the new objective to editing mode and expand it
    setEditingObjectiveOriginal({ ...newObjective });
    setEditingObjective(newObjective.id);
    setExpandedObjectives(prev => new Set([...prev, newObjective.id]));
  };

  const updateObjectiveTitle = (id: string, title: string) => {
    const updated = objectives.map(obj =>
      obj.id === id ? { ...obj, title } : obj
    );
    updateData(updated);
  };

  const updateObjectiveType = (id: string, type: 'Operational' | 'Managerial') => {
    const updated = objectives.map(obj =>
      obj.id === id ? { ...obj, type } : obj
    );
    updateData(updated);
  };

  const deleteObjective = (id: string) => {
    updateData(objectives.filter(obj => obj.id !== id));
  };

  const startEditingObjective = (objective: Objective) => {
    setEditingObjectiveOriginal({ ...objective });
    setEditingObjective(objective.id);
  };

  const saveObjectiveEdit = () => {
    setEditingObjective(null);
    setEditingObjectiveOriginal(null);
  };

  const cancelObjectiveEdit = () => {
    if (editingObjectiveOriginal) {
      const updated = objectives.map(obj =>
        obj.id === editingObjectiveOriginal.id ? editingObjectiveOriginal : obj
      );
      updateData(updated);
    }
    setEditingObjective(null);
    setEditingObjectiveOriginal(null);
  };

  const addAction = (objectiveId: string) => {
    const newAction: Action = {
      id: Date.now().toString(),
      description: '',
      status: 'Current',
      assignee: '',
      time: '',
      date: '',
      timezone: 'UTC'
    };
    const updated = objectives.map(obj =>
      obj.id === objectiveId 
        ? { ...obj, actions: [...obj.actions, newAction] }
        : obj
    );
    updateData(updated);
  };

  const updateAction = (objectiveId: string, actionId: string, field: keyof Action, value: string) => {
    const updated = objectives.map(obj =>
      obj.id === objectiveId
        ? {
            ...obj,
            actions: obj.actions.map(action =>
              action.id === actionId ? { ...action, [field]: value } : action
            )
          }
        : obj
    );
    updateData(updated);
  };

  const deleteAction = (objectiveId: string, actionId: string) => {
    const updated = objectives.map(obj =>
      obj.id === objectiveId
        ? { ...obj, actions: obj.actions.filter(action => action.id !== actionId) }
        : obj
    );
    updateData(updated);
  };

  const startEditingAction = (objectiveId: string, action: Action) => {
    setEditingActionOriginal({ ...action });
    setEditingAction({ objectiveId, actionId: action.id });
  };

  const saveActionEdit = () => {
    setEditingAction(null);
    setEditingActionOriginal(null);
  };

  const cancelActionEdit = () => {
    if (editingActionOriginal && editingAction) {
      const updated = objectives.map(obj =>
        obj.id === editingAction.objectiveId
          ? {
              ...obj,
              actions: obj.actions.map(action =>
                action.id === editingAction.actionId ? editingActionOriginal : action
              )
            }
          : obj
      );
      updateData(updated);
    }
    setEditingAction(null);
    setEditingActionOriginal(null);
  };

  

  const toggleObjective = (objectiveId: string) => {
    setExpandedObjectives(prev => {
      const newSet = new Set(prev);
      if (newSet.has(objectiveId)) {
        newSet.delete(objectiveId);
      } else {
        newSet.add(objectiveId);
      }
      return newSet;
    });
  };

  const toggleChildIncident = (childId: string) => {
    setExpandedChildIncidents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(childId)) {
        newSet.delete(childId);
      } else {
        newSet.add(childId);
      }
      return newSet;
    });
  };

  const toggleRecommended = (objectiveId: string) => {
    setShowRecommended(prev => {
      const next = new Set(prev);
      const enabling = !next.has(objectiveId);
      if (enabling) {
        next.add(objectiveId);
        onRecommendActions && onRecommendActions();
        // If no actions, generate context-aware actions based on the objective title
        const updated = objectives.map(obj => {
          if (obj.id !== objectiveId) return obj;
          const hasActions = obj.actions && obj.actions.length > 0;
          const actionsToUse = hasActions ? obj.actions : getRecommendedActionsForObjective(obj.title);
          return {
            ...obj,
            actions: actionsToUse.map((action, idx) => ({
              ...action,
              assignee:
                action.assignee && action.assignee.trim().length > 0
                  ? action.assignee
                  : officialNames[idx % officialNames.length],
            })),
          };
        });
        updateData(updated);
      } else {
        next.delete(objectiveId);
      }
      return next;
    });
  };

  // Filter objectives based on search term and incident type
  const filteredObjectives = objectives.filter(objective => {
    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        objective.title.toLowerCase().includes(searchLower) ||
        objective.actions.some(action => 
          action.description.toLowerCase().includes(searchLower)
        );
      if (!matchesSearch) return false;
    }
    
    // Filter by incident type
    if (selectedIncidentTypes.length > 0) {
      const incidentType = getIncidentType(objective);
      if (!selectedIncidentTypes.includes(incidentType)) return false;
    }
    
    return true;
  });

  // Handler for incident type selection
  const toggleIncidentType = (type: string) => {
    setSelectedIncidentTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const clearIncidentTypeFilter = () => {
    setSelectedIncidentTypes([]);
  };

  return (
    <div className="space-y-6">
      {/* Header Section - Sticky */}
      <div className="sticky top-0 z-10 bg-[#222529] rounded-lg border border-[#6e757c] relative">
        <div className="flex items-center justify-between px-[13px] py-3 w-full border-b-2 border-border rounded-t-lg rounded-b-none">
          {/* Title */}
          <div className="relative shrink-0 flex items-center gap-2">
            <p className="caption text-nowrap text-white whitespace-pre">
              Incidents
            </p>
            <span className="caption text-white">
              ({objectives.filter(obj => getIncidentDetails(obj.id).status === 'Active').length} active)
            </span>
          </div>

          {/* Search and Add Objective Button */}
          <div className="flex items-center gap-[29px]">
            {/* Search Input */}
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

            {/* Add Objective Button */}
            <button
              onClick={() => setIsAddIncidentModalOpen(true)}
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
              <p className="caption text-nowrap text-white ml-[21px]">
                Add Incident
              </p>
            </button>
          </div>
        </div>
      </div>

      {/* Incident Type Filter */}
      <div className="space-y-3 px-4 py-3 bg-[#222529] rounded-lg border border-[#6e757c]">
        <div className="flex items-center gap-2">
          <span className="caption text-white whitespace-nowrap">Incident Type:</span>
          <Popover open={isIncidentTypePopoverOpen} onOpenChange={setIsIncidentTypePopoverOpen}>
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
                {selectedIncidentTypes.length === 0 
                  ? 'All Types' 
                  : selectedIncidentTypes.length === 1 
                  ? selectedIncidentTypes[0]
                  : `${selectedIncidentTypes.length} types selected`}
                <ChevronDown className="h-3 w-3 shrink-0 opacity-50" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0 bg-[#222529] border-[#6e757c]" align="start">
              <Command className="bg-[#222529]">
                <CommandInput 
                  placeholder="Search incident type..." 
                  className="h-9 caption text-white"
                  style={{ 
                    fontFamily: "'Open Sans', sans-serif",
                    fontSize: '12px',
                    fontWeight: 400,
                    lineHeight: '18px'
                  }}
                />
                <CommandList>
                  <CommandEmpty className="caption text-white/70 p-2">No incident type found.</CommandEmpty>
                  <CommandGroup>
                    {incidentTypes.map((type) => (
                      <CommandItem
                        key={type}
                        value={type}
                        onSelect={() => toggleIncidentType(type)}
                        className="caption text-white cursor-pointer hover:bg-[#14171a] data-[selected=true]:bg-[#14171a]"
                        style={{ 
                          fontFamily: "'Open Sans', sans-serif",
                          fontSize: '12px',
                          fontWeight: 400,
                          lineHeight: '18px'
                        }}
                      >
                        <Checkbox
                          checked={selectedIncidentTypes.includes(type)}
                          className="mr-2 h-3 w-3 border-white data-[state=checked]:bg-accent data-[state=checked]:border-accent"
                        />
                        {type}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          {selectedIncidentTypes.length > 0 && (
            <button
              onClick={clearIncidentTypeFilter}
              className="p-1 hover:bg-muted/30 rounded transition-colors"
              title="Clear filter"
            >
              <X className="w-3 h-3 text-white" />
            </button>
          )}
        </div>
      </div>

      {/* Objectives List */}
      <div className="space-y-4">
        {filteredObjectives.map((objective) => (
          <div
            key={objective.id}
            className="border border-border rounded-lg overflow-hidden"
            style={{ 
              background: 'linear-gradient(90deg, rgba(104, 118, 238, 0.08) 0%, rgba(0, 0, 0, 0) 100%), linear-gradient(90deg, rgb(20, 23, 26) 0%, rgb(20, 23, 26) 100%)'
            }}
          >
            {/* Objective Header */}
            <div className={`p-3 ${expandedObjectives.has(objective.id) ? 'border-b border-border' : ''}`}>
              {editingObjective === objective.id ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-start gap-2" onClick={(e) => e.stopPropagation()}>
                    <Select
                      value={objective.type}
                      onValueChange={(value) => updateObjectiveType(objective.id, value as 'Operational' | 'Managerial')}
                    >
                      <SelectTrigger 
                        className="w-14 h-[22px] bg-input-background border-border !text-[12px] flex-shrink-0"
                        style={{ fontFamily: "'Open Sans', sans-serif", lineHeight: '1.5' }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent onClick={(e) => e.stopPropagation()}>
                        <SelectItem 
                          value="Operational"
                          className="!text-[12px]"
                          style={{ fontFamily: "'Open Sans', sans-serif", lineHeight: '1.5' }}
                        >
                          O
                        </SelectItem>
                        <SelectItem 
                          value="Managerial"
                          className="!text-[12px]"
                          style={{ fontFamily: "'Open Sans', sans-serif", lineHeight: '1.5' }}
                        >
                          M
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      value={objective.title}
                      onChange={(e) => updateObjectiveTitle(objective.id, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveObjectiveEdit();
                        if (e.key === 'Escape') cancelObjectiveEdit();
                      }}
                      placeholder="Enter objective text"
                      autoFocus
                      className="bg-input-background border-border text-card-foreground caption"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        saveObjectiveEdit();
                      }}
                      size="sm"
                      className="bg-primary hover:bg-primary/90 h-[22.75px] px-3"
                    >
                      Save
                    </Button>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        cancelObjectiveEdit();
                      }}
                      variant="outline"
                      size="sm"
                      className="border-border h-[22.75px] px-3"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between">
                  <div 
                    className="flex items-start gap-2 flex-1 cursor-pointer"
                    onClick={() => {
                      toggleObjective(objective.id);
                      if (onAddAIContext) {
                        onAddAIContext(objective.title);
                      }
                    }}
                  >
                    {expandedObjectives.has(objective.id) ? (
                      <ChevronDown className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <span className="caption text-white">{objective.title}</span>
                    </div>
                  </div>
              <div className="flex items-center gap-2">
                <span 
                  className="caption px-2 py-0.5 rounded"
                  style={{ 
                    backgroundColor: `${getSeverityColor(getIncidentSeverity(objective.id))}20`,
                    color: getSeverityColor(getIncidentSeverity(objective.id)),
                    border: `1px solid ${getSeverityColor(getIncidentSeverity(objective.id))}60`
                  }}
                >
                  {getIncidentSeverity(objective.id)}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // Apply data layer filter
                    if (onApplyDataLayerFilter) {
                      const incident = getIncidentFilterValue(objective.id);
                      onApplyDataLayerFilter(incident);
                    }
                  }}
                  className="p-1 hover:bg-muted/30 rounded transition-colors"
                  title="Filter incident"
                >
                  <Filter className="w-3 h-3 text-white" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // Zoom to incident location
                    if (onZoomToLocation) {
                      const coords = getIncidentCoordinates(objective.id);
                      onZoomToLocation(coords.center, coords.scale);
                    }
                  }}
                  className="p-1 hover:bg-muted/30 rounded transition-colors"
                  title="Zoom to incident location"
                >
                  <Map className="w-3 h-3 text-white" />
                </button>
              </div>
                </div>
              )}
            </div>

            {/* Incident Details Section */}
            {expandedObjectives.has(objective.id) && (
              <div className="p-4 space-y-4 bg-card/50">
                {(() => {
                  const d = getIncidentDetails(objective.id);
                  return (
                    <>
                      {/* Incident Workspace Button */}
                      <div className="mb-4 flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                          className="bg-[#01669f] h-[22.75px] rounded-[4px] px-4 hover:bg-[#01669f]/90 transition-colors flex items-center justify-center"
                        >
                          <p className="caption text-nowrap text-white">Incident Workspace</p>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsAddIncidentModalOpen(true);
                          }}
                          className="bg-[#01669f] h-[22.75px] rounded-[4px] px-4 hover:bg-[#01669f]/90 transition-colors flex items-center justify-center gap-2"
                        >
                          <div className="size-[13px]">
                            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13 13">
                              <g>
                                <path d="M2.70833 6.5H10.2917" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.08333" />
                                <path d="M6.5 2.70833V10.2917" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.08333" />
                              </g>
                            </svg>
                          </div>
                          <p className="caption text-nowrap text-white">Add Child Incident</p>
                        </button>
                      </div>
                      
                      {/* Incident Description */}
                      {d.description && (
                        <div>
                          <p className="caption text-white leading-relaxed">{d.description}</p>
                        </div>
                      )}
                      
                      {/* Incident Details Grid */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="caption text-white/70 mb-1 block">Location</label>
                          <p className="caption text-white">{d.location}</p>
                        </div>
                        <div>
                          <label className="caption text-white/70 mb-1 block">Status</label>
                          <p className="caption text-white">{d.status}</p>
                        </div>
                        <div>
                          <label className="caption text-white/70 mb-1 block">Start Time</label>
                          <p className="caption text-white">{d.startTime}</p>
                        </div>
                        <div>
                          <label className="caption text-white/70 mb-1 block">Estimated Volume</label>
                          <p className="caption text-white">{d.estimatedVolume}</p>
                        </div>
                        <div>
                          <label className="caption text-white/70 mb-1 block">Shoreline Impact</label>
                          <p className="caption text-white">{d.shorelineImpact}</p>
                        </div>
                        <div>
                          <label className="caption text-white/70 mb-1 block">Responsible Party</label>
                          <p className="caption text-white">{d.responsibleParty}</p>
                        </div>
                        <div>
                          <label className="caption text-white/70 mb-1 block">Incident Commander</label>
                          <p className="caption text-white">{d.incidentCommander}</p>
                        </div>
                        <div>
                          <label className="caption text-white/70 mb-1 block">Last Update</label>
                          <p className="caption text-white">{d.lastUpdate}</p>
                        </div>
                      </div>

                      {/* Child Incidents */}
                      {objective.childIncidents && objective.childIncidents.length > 0 && (
                        <div className="mt-4">
                          <label className="caption text-white mb-2 block">Child Incidents</label>
                          <div className="space-y-3">
                            {objective.childIncidents.map((child) => {
                              const isChildExpanded = expandedChildIncidents.has(child.id);
                              const childDetails = getIncidentDetails(child.id);
                              const childSeverity = getIncidentSeverity(child.id);
                              
                              return (
                                <div
                                  key={child.id}
                                  className="border border-border/50 rounded-lg overflow-hidden"
                                  style={{ backgroundColor: 'rgba(139, 123, 168, 0.15)' }}
                                >
                                  <div className={`p-3 ${isChildExpanded ? 'border-b border-border/50' : ''}`}>
                                    <div className="flex items-start justify-between">
                                      <div
                                        className="flex items-start gap-2 cursor-pointer flex-1"
                                        onClick={() => toggleChildIncident(child.id)}
                                      >
                                        {isChildExpanded ? (
                                          <ChevronDown className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                                        ) : (
                                          <ChevronRight className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                                        )}
                                        <div className="flex-1">
                                          <span className="caption text-white">{child.title}</span>
                                          {!isChildExpanded && (
                                            <div className="flex items-center gap-2 mt-1">
                                              <span 
                                                className="caption px-2 py-0.5 rounded text-xs"
                                                style={{ 
                                                  backgroundColor: `${getSeverityColor(childSeverity)}20`,
                                                  color: getSeverityColor(childSeverity),
                                                  border: `1px solid ${getSeverityColor(childSeverity)}60`
                                                }}
                                              >
                                                {childSeverity}
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            // Apply data layer filter
                                            if (onApplyDataLayerFilter) {
                                              const incident = getIncidentFilterValue(child.id);
                                              onApplyDataLayerFilter(incident);
                                            }
                                          }}
                                          className="p-1 hover:bg-muted/30 rounded transition-colors"
                                          title="Filter child incident"
                                        >
                                          <Filter className="w-3 h-3 text-white" />
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (onZoomToLocation) {
                                              const coords = getIncidentCoordinates(child.id);
                                              onZoomToLocation(coords.center, coords.scale);
                                            }
                                          }}
                                          className="p-1 hover:bg-muted/30 rounded transition-colors"
                                          title="Zoom to child incident location"
                                        >
                                          <Map className="w-3 h-3 text-white" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Child Incident Details */}
                                  {isChildExpanded && (
                                    <div className="p-3 space-y-3 bg-card/30">
                                      {/* Child Incident Workspace Button */}
                                      <div className="mb-3">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                          }}
                                          className="bg-[#01669f] h-[22.75px] rounded-[4px] px-4 hover:bg-[#01669f]/90 transition-colors flex items-center justify-center"
                                        >
                                          <p className="caption text-nowrap text-white">Incident Workspace</p>
                                        </button>
                                      </div>

                                      {/* Child Incident Description */}
                                      {childDetails.description && (
                                        <div>
                                          <p className="caption text-white leading-relaxed text-sm">{childDetails.description}</p>
                                        </div>
                                      )}

                                      {/* Child Incident Details Grid */}
                                      <div className="grid grid-cols-2 gap-3">
                                        <div>
                                          <label className="caption text-white/70 mb-1 block text-xs">Location</label>
                                          <p className="caption text-white text-sm">{childDetails.location}</p>
                                        </div>
                                        <div>
                                          <label className="caption text-white/70 mb-1 block text-xs">Status</label>
                                          <p className="caption text-white text-sm">{childDetails.status}</p>
                                        </div>
                                        <div>
                                          <label className="caption text-white/70 mb-1 block text-xs">Start Time</label>
                                          <p className="caption text-white text-sm">{childDetails.startTime}</p>
                                        </div>
                                        <div>
                                          <label className="caption text-white/70 mb-1 block text-xs">Estimated Volume</label>
                                          <p className="caption text-white text-sm">{childDetails.estimatedVolume}</p>
                                        </div>
                                        <div>
                                          <label className="caption text-white/70 mb-1 block text-xs">Shoreline Impact</label>
                                          <p className="caption text-white text-sm">{childDetails.shorelineImpact}</p>
                                        </div>
                                        <div>
                                          <label className="caption text-white/70 mb-1 block text-xs">Responsible Party</label>
                                          <p className="caption text-white text-sm">{childDetails.responsibleParty}</p>
                                        </div>
                                        <div>
                                          <label className="caption text-white/70 mb-1 block text-xs">Incident Commander</label>
                                          <p className="caption text-white text-sm">{childDetails.incidentCommander}</p>
                                        </div>
                                        <div>
                                          <label className="caption text-white/70 mb-1 block text-xs">Last Update</label>
                                          <p className="caption text-white text-sm">{childDetails.lastUpdate}</p>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Incident Modal */}
      <Dialog open={isAddIncidentModalOpen} onOpenChange={setIsAddIncidentModalOpen}>
        <DialogContent className="bg-[#222529] border-[#6e757c]">
          <DialogHeader>
            <DialogTitle className="caption text-white">placeholder modal</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}
