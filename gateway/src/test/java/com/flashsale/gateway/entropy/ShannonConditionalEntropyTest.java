package com.flashsale.gateway.entropy;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class ShannonConditionalEntropyTest {

    @Test
    void compute_zeroMatrix_returnsZero() {
        int[][] matrix = new int[4][4];
        double h = ShannonConditionalEntropy.compute(matrix);
        assertThat(h).isEqualTo(0.0);
    }

    @Test
    void compute_deterministicSingleTransition_returnsZeroEntropy() {
        int[][] matrix = {
                {0, 0, 0, 100},
                {0, 0, 0, 0},
                {0, 0, 0, 0},
                {0, 0, 0, 0}
        };
        double h = ShannonConditionalEntropy.compute(matrix);
        assertThat(h).isBetween(0.0, 0.01);
    }

    @Test
    void compute_uniformDistribution_returnsMaxEntropy() {
        int[][] matrix = {
                {25, 25, 25, 25},
                {0, 0, 0, 0},
                {0, 0, 0, 0},
                {0, 0, 0, 0}
        };
        double h = ShannonConditionalEntropy.compute(matrix);
        assertThat(h).isBetween(1.9, 2.01);
    }

    @Test
    void compute_highPotentialUser_isYellowDueToDeterministicPath() {
        int[][] matrix = {
                {0, 15, 5, 2},
                {0, 0, 10, 3},
                {0, 0, 0, 8},
                {0, 0, 0, 1}
        };
        double h = ShannonConditionalEntropy.compute(matrix);
        String color = ShannonConditionalEntropy.classify(h);
        assertThat(h).isBetween(0.5, 1.5);
        assertThat(color).isEqualTo("YELLOW");
    }

    @Test
    void compute_diverseUser_isGreen() {
        int[][] matrix = {
                {0, 10, 10, 10},
                {5, 0, 5, 5},
                {3, 3, 0, 3},
                {2, 2, 2, 0}
        };
        double h = ShannonConditionalEntropy.compute(matrix);
        String color = ShannonConditionalEntropy.classify(h);
        assertThat(color).isEqualTo("GREEN");
    }

    @Test
    void compute_botUser_isBlack() {
        int[][] matrix = {
                {0, 0, 0, 50},
                {0, 0, 0, 0},
                {0, 0, 0, 0},
                {0, 0, 0, 0}
        };
        double h = ShannonConditionalEntropy.compute(matrix);
        String color = ShannonConditionalEntropy.classify(h);
        assertThat(color).isEqualTo("BLACK");
    }

    @Test
    void classify_boundaryConditions() {
        assertThat(ShannonConditionalEntropy.classify(0.0)).isEqualTo("BLACK");
        assertThat(ShannonConditionalEntropy.classify(0.49)).isEqualTo("BLACK");
        assertThat(ShannonConditionalEntropy.classify(0.5)).isEqualTo("YELLOW");
        assertThat(ShannonConditionalEntropy.classify(1.49)).isEqualTo("YELLOW");
        assertThat(ShannonConditionalEntropy.classify(1.5)).isEqualTo("GREEN");
        assertThat(ShannonConditionalEntropy.classify(2.5)).isEqualTo("GREEN");
        assertThat(ShannonConditionalEntropy.classify(3.5)).isEqualTo("GREEN");
        assertThat(ShannonConditionalEntropy.classify(3.51)).isEqualTo("YELLOW");
    }

    @Test
    void compute_multiRowWeightedEntropy() {
        int[][] matrix = {
                {10, 10, 10, 10},
                {0, 0, 0, 100},
                {0, 0, 0, 0},
                {0, 0, 0, 0}
        };
        double h = ShannonConditionalEntropy.compute(matrix);
        assertThat(h).isBetween(0.5, 1.5);
    }

    @Test
    void stateIndex_validStates() {
        assertThat(ShannonConditionalEntropy.stateIndex("DETAIL")).isEqualTo(0);
        assertThat(ShannonConditionalEntropy.stateIndex("FAV")).isEqualTo(1);
        assertThat(ShannonConditionalEntropy.stateIndex("CART")).isEqualTo(2);
        assertThat(ShannonConditionalEntropy.stateIndex("SECKILL")).isEqualTo(3);
        assertThat(ShannonConditionalEntropy.stateIndex("UNKNOWN")).isEqualTo(-1);
    }

    @Test
    void stateName_validIndices() {
        assertThat(ShannonConditionalEntropy.stateName(0)).isEqualTo("DETAIL");
        assertThat(ShannonConditionalEntropy.stateName(3)).isEqualTo("SECKILL");
        assertThat(ShannonConditionalEntropy.stateName(-1)).isNull();
        assertThat(ShannonConditionalEntropy.stateName(4)).isNull();
    }
}
