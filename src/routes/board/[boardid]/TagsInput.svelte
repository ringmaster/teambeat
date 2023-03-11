<script>
    import BulmaTagsInput from "@creativebulma/bulma-tagsinput";
    import { createEventDispatcher } from 'svelte';

    export let value = [];
    export let instance;

    const dispatch = createEventDispatcher();
    
    function tagInput(node) {
        let options = {
            allowDuplicates: false,
            caseSensitive: true,
            clearSelectionOnTyping: false,
            closeDropdownOnItemSelect: true,
            delimiter: ',',
            freeInput: false,
            highlightDuplicate: true,
            highlightMatchesString: true,
            itemValue: undefined,
            itemText: undefined,
            maxTags: undefined,
            maxChars: undefined,
            minChars: 1,
            noResultsLabel: 'No results found',
            placeholder: '',
            removable: true,
            searchMinChars: 1,
            searchOn: 'text',
            selectable: true,
            source: undefined,
            tagClass: 'is-rounded',
            trim: true
        }
        
        new BulmaTagsInput(node, options);
        instance = node.BulmaTagsInput();


        instance.on('after.add', doChange);
        instance.on('after.remove', doChange);

    }

    function doChange(data) {
        dispatch('change', value);
    }

</script>

<div class="field">
    <div class="control">
        <select data-type="tags" data-placeholder="Choose Options" use:tagInput multiple bind:value={value}>
            <slot></slot>
        </select>
    </div>
</div>