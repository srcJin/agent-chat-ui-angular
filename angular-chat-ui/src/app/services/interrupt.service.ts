import { Injectable, signal, computed, effect } from '@angular/core';
import { 
  HumanInterrupt, 
  HumanResponse, 
  HumanResponseWithEdits, 
  SubmitType,
  ActionRequest
} from '../models/interrupt.types';
import { StreamService } from './stream.service';

@Injectable({
  providedIn: 'root'
})
export class InterruptService {
  // State signals
  private _humanResponse = signal<HumanResponseWithEdits[]>([]);
  private _loading = signal(false);
  private _streaming = signal(false);
  private _streamFinished = signal(false);
  private _selectedSubmitType = signal<SubmitType | undefined>(undefined);
  private _hasEdited = signal(false);
  private _hasAddedResponse = signal(false);
  private _acceptAllowed = signal(false);
  private _initialValues = signal<Record<string, string>>({});

  // Computed properties
  readonly humanResponse = computed(() => this._humanResponse());
  readonly loading = computed(() => this._loading());
  readonly streaming = computed(() => this._streaming());
  readonly streamFinished = computed(() => this._streamFinished());
  readonly selectedSubmitType = computed(() => this._selectedSubmitType());
  readonly hasEdited = computed(() => this._hasEdited());
  readonly hasAddedResponse = computed(() => this._hasAddedResponse());
  readonly acceptAllowed = computed(() => this._acceptAllowed());
  readonly initialValues = computed(() => this._initialValues());

  readonly supportsMultipleMethods = computed(() => {
    const responses = this._humanResponse();
    const editResp = responses.find(r => r.type === 'edit');
    const responseResp = responses.find(r => r.type === 'response');
    return !!(editResp && responseResp);
  });

  constructor(private streamService: StreamService) {
    // Set up effects to monitor streaming state
    effect(() => {
      // Monitor stream service state if needed
      this._streaming.set(this.streamService.isLoading());
    });
  }

  initializeWithInterrupt(interrupt: HumanInterrupt): void {
    const responses: HumanResponseWithEdits[] = [];
    const initialVals: Record<string, string> = {};

    // Initialize edit response if allowed
    if (interrupt.config.allow_edit) {
      const editResponse: HumanResponseWithEdits = {
        type: 'edit',
        args: { args: { ...interrupt.action_request.args } },
        editsMade: false,
        acceptAllowed: interrupt.config.allow_accept
      };
      responses.push(editResponse);

      // Store initial values for reset functionality
      Object.entries(interrupt.action_request.args).forEach(([key, value]) => {
        initialVals[key] = typeof value === 'string' ? value : JSON.stringify(value);
      });
    }

    // Initialize response if allowed
    if (interrupt.config.allow_respond) {
      const responseResp: HumanResponseWithEdits = {
        type: 'response',
        args: ''
      };
      responses.push(responseResp);
    }

    this._humanResponse.set(responses);
    this._acceptAllowed.set(interrupt.config.allow_accept);
    this._initialValues.set(initialVals);
    this._hasEdited.set(false);
    this._hasAddedResponse.set(false);
  }

  onEditChange(
    value: string | string[], 
    editResponse: HumanResponseWithEdits, 
    key: string | string[], 
    initialValues: Record<string, string>
  ): void {
    const currentResponses = this._humanResponse();
    const editIndex = currentResponses.findIndex(r => r.type === 'edit');
    
    if (editIndex === -1) return;

    const updatedResponses = [...currentResponses];
    const updatedEditResp = { ...updatedResponses[editIndex] };

    // Handle single key-value update
    if (typeof key === 'string' && typeof value === 'string') {
      if (typeof updatedEditResp.args === 'object' && updatedEditResp.args?.args) {
        updatedEditResp.args.args[key] = value;
        
        // Check if any edits were made
        const hasChanges = Object.entries(updatedEditResp.args.args).some(([k, v]) => {
          const initialValue = initialValues[k];
          const currentValue = typeof v === 'string' ? v : JSON.stringify(v);
          return currentValue !== initialValue;
        });
        
        updatedEditResp.editsMade = hasChanges;
        this._hasEdited.set(hasChanges);
      }
    }

    updatedResponses[editIndex] = updatedEditResp;
    this._humanResponse.set(updatedResponses);
  }

  onResponseChange(value: string, responseResponse: HumanResponseWithEdits): void {
    const currentResponses = this._humanResponse();
    const responseIndex = currentResponses.findIndex(r => r.type === 'response');
    
    if (responseIndex === -1) return;

    const updatedResponses = [...currentResponses];
    const updatedResponseResp = { ...updatedResponses[responseIndex] };
    updatedResponseResp.args = value;

    updatedResponses[responseIndex] = updatedResponseResp;
    this._humanResponse.set(updatedResponses);
    this._hasAddedResponse.set(value.trim().length > 0);
  }

  async handleSubmit(interrupt: HumanInterrupt): Promise<void> {
    this._loading.set(true);
    this._streaming.set(true);

    try {
      const responses = this._humanResponse();
      const editResp = responses.find(r => r.type === 'edit');
      const responseResp = responses.find(r => r.type === 'response');

      let submitType: SubmitType;
      let submitArgs: any;

      // Determine submit type and args
      if (editResp?.acceptAllowed && !editResp.editsMade) {
        submitType = 'accept';
        submitArgs = null;
      } else if (editResp?.editsMade) {
        submitType = 'edit';
        submitArgs = editResp.args;
      } else if (responseResp && this._hasAddedResponse()) {
        submitType = 'response';
        submitArgs = responseResp.args;
      } else {
        throw new Error('No valid submit action available');
      }

      this._selectedSubmitType.set(submitType);

      // In a real app, this would make the actual API call
      console.log('Submitting interrupt response:', {
        type: submitType,
        args: submitArgs,
        interrupt: interrupt
      });

      // Simulate API call
      await this.simulateSubmit(submitType, submitArgs, interrupt);

      this._streamFinished.set(true);
    } catch (error) {
      console.error('Failed to submit interrupt response:', error);
      throw error;
    } finally {
      this._loading.set(false);
      this._streaming.set(false);
    }
  }

  async handleResolve(): Promise<void> {
    this._loading.set(true);
    try {
      // In a real app, this would call the API to resolve the thread
      console.log('Resolving thread...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Thread resolved');
    } finally {
      this._loading.set(false);
    }
  }

  async handleIgnore(): Promise<void> {
    this._loading.set(true);
    try {
      // In a real app, this would call the API to ignore the interrupt
      console.log('Ignoring interrupt...');
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log('Interrupt ignored');
    } finally {
      this._loading.set(false);
    }
  }

  private async simulateSubmit(
    type: SubmitType, 
    args: any, 
    interrupt: HumanInterrupt
  ): Promise<void> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // In a real implementation, this would:
    // 1. Send the response to the LangGraph API
    // 2. Resume the interrupted thread
    // 3. Handle the streaming response
    
    console.log(`Simulated ${type} submission completed`);
  }

  reset(): void {
    this._humanResponse.set([]);
    this._loading.set(false);
    this._streaming.set(false);
    this._streamFinished.set(false);
    this._selectedSubmitType.set(undefined);
    this._hasEdited.set(false);
    this._hasAddedResponse.set(false);
    this._acceptAllowed.set(false);
    this._initialValues.set({});
  }
} 