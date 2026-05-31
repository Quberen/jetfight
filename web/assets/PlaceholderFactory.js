import * as THREE from 'three';
// Fallback geometry when GLB models are missing
export class PlaceholderFactory {
    static create(key) {
        switch (key) {
            case 'player_jet': return this.makeJet(0x88aacc);
            case 'enemy_jet': return this.makeJet(0xcc4433);
            case 'missile': return this.makeMissile();
            default: return new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial({ color: 0xaaaaaa }));
        }
    }
    static makeJet(color) {
        const group = new THREE.Group();
        const mat = new THREE.MeshLambertMaterial({ color });
        // Fuselage
        const fuselage = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.3, 8, 8), mat);
        fuselage.rotation.x = Math.PI / 2;
        group.add(fuselage);
        // Wings
        const wingGeo = new THREE.BoxGeometry(10, 0.15, 3);
        const wings = new THREE.Mesh(wingGeo, mat);
        wings.position.z = 1;
        group.add(wings);
        // Tail fins
        const tailGeo = new THREE.BoxGeometry(4, 0.15, 1.5);
        const tail = new THREE.Mesh(tailGeo, mat);
        tail.position.z = 4;
        tail.position.y = 0.5;
        group.add(tail);
        const tailV = new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.5, 1.5), mat);
        tailV.position.z = 4;
        tailV.position.y = 0.75;
        group.add(tailV);
        // Engine glow
        const geoGlow = new THREE.CylinderGeometry(0.3, 0.3, 0.5, 8);
        const matGlow = new THREE.MeshBasicMaterial({ color: 0xff6600 });
        const glow = new THREE.Mesh(geoGlow, matGlow);
        glow.name = 'engine_glow';
        glow.rotation.x = Math.PI / 2;
        glow.position.z = 4.2;
        group.add(glow);
        return group;
    }
    static makeMissile() {
        const group = new THREE.Group();
        const mat = new THREE.MeshLambertMaterial({ color: 0xdddddd });
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 2, 6), mat);
        body.rotation.x = Math.PI / 2;
        group.add(body);
        const tip = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.5, 6), mat);
        tip.rotation.x = Math.PI / 2;
        tip.position.z = -1.25;
        group.add(tip);
        return group;
    }
}
