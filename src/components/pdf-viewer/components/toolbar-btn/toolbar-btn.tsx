import { Component, Prop } from "@stencil/core";


@Component({
    tag: 'hive-pdf-toolbar-btn',
    styleUrl: 'toolbar-btn.scss',
    shadow: true
})
export class HivePDFToolbarBtnComponent {

    @Prop() title: string;

    render() {
        return (
            <button title={this.title}>
                <slot />
                {/* <svg class="side-drawer-btn" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <g id="e236b97c-3920-4be5-b6a8-a5eb5d413154" data-name="Layer 1">
                        <path d="M3.25 1A2.25 2.25 0 0 0 1 3.25v17.5A2.25 2.25 0 0 0 3.25 23H11V1zM8 19.5a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-3a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5zm0-6a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-3a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5zm0-6a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-3a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5z"></path>
                        <path class="right-path" d="M11 2h9.75A1.25 1.25 0 0 1 22 3.25v17.5A1.25 1.25 0 0 1 20.75 22H11"></path>
                    </g>
                </svg> */}
            </button>
        );
    }
    // hidden={!this.enableSideDrawer}
    // onClick={() => this.toggleSideDrawer()}>

}
